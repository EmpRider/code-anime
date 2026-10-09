import { createHash } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { traceToFlow, type AnalysisInput, CandidateError } from './contract.js';
import type { Trace, TraceEvent } from '../domain/trace.js';

interface SymbolInfo {
  name: string;
  file: string;
  line: number;
  snippet: string;
  members: Array<{ name: string; line: number }>;
}
const idOf = (node: SymbolInfo) => `${node.name}@${node.file}:${node.line}`;

function textOf(response: CallToolResult) {
  const text = response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
  if (response.isError) throw new Error(`CodeGraph: ${text.slice(0, 800)}`);
  if (text.length > 256000)
    throw new Error('CodeGraph response exceeds adapter limit');
  return text;
}
// Parse documented CodeGraph output only, never project source syntax.
export function parseNodes(text: string): SymbolInfo[] {
  const results: SymbolInfo[] = [];
  const sections = [...text.matchAll(/^\*\*(.+?)\*\* \([\w_]+\)\r?\n/gm)];
  for (let i = 0; i < sections.length; i++) {
    const match = sections[i]!;
    const section = text.slice(
      match.index!,
      sections[i + 1]?.index ?? text.length,
    );
    const location = section.match(/^\*\*Location:\*\* (.+?):(\d+)\s*$/m);
    if (!location) continue;
    const snippet = section.match(/```[^\n]*\n([\s\S]*?)\n```/)?.[1] ?? '';
    const members = [
      ...section.matchAll(/^- (.+?) \([\w_]+\):(\d+)(?: — .*|\s*)$/gm),
    ].map((m) => ({ name: m[1]!, line: Number(m[2]) }));
    results.push({
      name: match[1]!,
      file: location[1]!,
      line: Number(location[2]),
      snippet: snippet.slice(0, 800),
      members,
    });
  }
  return results;
}
function selectedTarget(target: string) {
  const match = target.match(/^(.+)@(.+):(\d+)$/);
  return match
    ? { symbol: match[1]!, file: match[2]!, line: Number(match[3]) }
    : { symbol: target };
}
async function connect(input: AnalysisInput, signal: AbortSignal) {
  const client = new Client({ name: 'code-anime', version: '0.5.0' });
  const transport = new StdioClientTransport({
    command: process.env.CODE_ANIME_CODEGRAPH_COMMAND || 'codegraph',
    args: ['serve', '--mcp', '--path', input.projectRoot],
    cwd: input.projectRoot,
    env: {
      ...process.env,
      CODEGRAPH_MCP_TOOLS: 'status,node,callees,search,explore,files',
      CODEGRAPH_NO_WATCH: '1',
    },
    stderr: 'pipe',
  });
  // Drain provider logs without contaminating MCP stdout or accumulating memory.
  transport.stderr?.on('data', () => {});
  const abort = () => {
    void client.close();
  };
  signal.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, 60000);
  try {
    if (signal.aborted) throw new Error('Analysis cancelled');
    await client.connect(transport);
    const listed = await client.listTools(undefined, {
      signal,
      timeout: 60000,
    });
    for (const tool of [
      'codegraph_status',
      'codegraph_node',
      'codegraph_callees',
    ]) {
      if (!listed.tools.some((t) => t.name === tool))
        throw new Error(
          `CodeGraph tool ${tool} is unavailable. Initialize/index this project or update CodeGraph.`,
        );
    }
    const call = async (name: string, args: Record<string, unknown>) => {
      if (signal.aborted) throw new Error('Analysis cancelled');
      return textOf(
        (await client.callTool(
          { name, arguments: { ...args, projectPath: input.projectRoot } },
          undefined,
          { signal, timeout: 60000 },
        )) as CallToolResult,
      );
    };
    const status = await call('codegraph_status', {});
    const count = status.match(/\*\*Files indexed:\*\*\s*(\d+)/);
    if (!count || Number(count[1]) === 0)
      throw new Error(
        'CodeGraph has no usable index for this project. Run codegraph init in the open project.',
      );
    if (
      /worktree.*mismatch|different.*worktree|pending resolution/i.test(status)
    )
      throw new Error(
        'CodeGraph index needs synchronization or belongs to a different worktree. Run codegraph sync for this project.',
      );
    return {
      client,
      call,
      tools: listed.tools,
      status,
      files: Number(count[1]),
      close: async () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        await client.close();
      },
    };
  } catch (error) {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
    await client.close().catch(() => {});
    throw new Error(
      `CodeGraph is required; analysis stopped. Verify installation and this project's index. ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
export async function verifyNativeCodeGraph(input: AnalysisInput) {
  const connection = await connect(input, new AbortController().signal);
  await connection.close();
}
export async function analyzeNativeCodeGraph(
  input: AnalysisInput,
  signal: AbortSignal,
) {
  const connection = await connect(input, signal);
  try {
    const evidence: string[] = [connection.status];
    const getNode = async (target: Record<string, unknown>) => {
      const text = await connection.call('codegraph_node', {
        ...target,
        includeCode: true,
      });
      evidence.push(text);
      const nodes = parseNodes(text);
      if (nodes.length > 1)
        throw new CandidateError(
          nodes.map((n) => ({
            id: idOf(n),
            name: n.name,
            file: n.file,
            line: n.line,
          })),
        );
      if (!nodes.length)
        throw new Error(
          `CodeGraph could not resolve a current, unambiguous symbol: ${String(target.symbol)}. ${text.slice(0, 300)}`,
        );
      return nodes[0]!;
    };
    const root = await getNode(selectedTarget(input.target));
    const events: TraceEvent[] = [];
    const expanded = new Set<string>();
    let truncated = false;
    let requests = 0;
    const maxEvents = input.maxEvents ?? 1000;
    const maxDepth = input.maxDepth ?? 12;
    const emit = (
      node: SymbolInfo,
      kind: 'enter' | 'call' | 'unresolved',
      stack: string[],
      values: Record<string, unknown>,
      note: string,
    ) => {
      if (events.length >= maxEvents) {
        truncated = true;
        return;
      }
      events.push({
        id: `event-${events.length}`,
        kind,
        symbolId: idOf(node),
        label: node.name,
        callId: idOf(node),
        source: { file: node.file, line: node.line, endLine: node.line },
        snippet: node.snippet,
        stack,
        values,
        certainty: kind === 'unresolved' ? 'unresolved' : 'static',
        note,
      });
    };
    const walk = async (node: SymbolInfo, stack: string[]) => {
      if (signal.aborted) throw new Error('Analysis cancelled');
      if (expanded.has(idOf(node))) return;
      if (
        stack.length >= maxDepth ||
        events.length >= maxEvents ||
        requests >= 100
      ) {
        truncated = true;
        return;
      }
      expanded.add(idOf(node));
      const path = [...stack, idOf(node)];
      emit(
        node,
        'enter',
        path,
        {},
        'Indexed symbol visit; graph traversal, not observed execution',
      );
      requests++;
      let text = await connection.call('codegraph_callees', {
        symbol: node.name,
        file: node.file,
        limit: 100,
      });
      evidence.push(text);
      if (/no definition.*matches file/i.test(text))
        throw new Error('CodeGraph ignored the requested definition file');
      if (/distinct definitions/i.test(text)) {
        // Same-file methods on different classes: CodeGraph supplies per-definition sections.
        const headings = [
          ...text.matchAll(/^\*\*(.+?)\*\* \([\w_]+\) — (.+?):(\d+)\s*$/gm),
        ];
        const index = headings.findIndex(
          (m) => m[2] === node.file && Number(m[3]) === node.line,
        );
        if (index < 0)
          throw new Error(
            'CodeGraph returned ambiguous callee definitions; narrow the target',
          );
        text = text.slice(
          headings[index]!.index!,
          headings[index + 1]?.index ?? text.length,
        );
      }
      const links = [
        ...text.matchAll(
          /^- (.+?) \(([\w_]+)\) - (.+?):(\d+)(?: — via (.+))?\s*$/gm,
        ),
      ].map((m) => ({
        name: m[1]!,
        file: m[3]!,
        line: Number(m[4]),
        relation: m[5] ?? 'call',
      }));
      if (
        !links.length &&
        !/^No callees found/m.test(text) &&
        !/^- \(no callees\)/m.test(text) &&
        !/\*\*Callees of .*\(0 found\)/.test(text)
      )
        throw new Error(
          `Unsupported CodeGraph callee response: ${text.slice(0, 300)}`,
        );
      if (/Showing \d+ of|… \+|truncated/i.test(text)) truncated = true;
      const children = [
        ...links,
        ...node.members
          .filter(
            (m) =>
              !links.some((l) => l.file === node.file && l.line === m.line),
          )
          .map((m) => ({ ...m, file: node.file, relation: 'member' })),
      ];
      for (const child of children) {
        if (events.length >= maxEvents || requests >= 100) {
          truncated = true;
          break;
        }
        const stub: SymbolInfo = { ...child, snippet: '', members: [] };
        emit(
          stub,
          'call',
          path,
          { from: idOf(node), to: idOf(stub), relationship: child.relation },
          'Indexed relationship; order and runtime values are unknown',
        );
        if (path.length >= maxDepth) {
          truncated = true;
          continue;
        }
        if (expanded.has(idOf(stub))) continue;
        requests++;
        try {
          const detail = await getNode({
            symbol: child.name,
            file: child.file,
            line: child.line,
          });
          if (detail.file !== child.file || detail.line !== child.line)
            throw new Error('Provider returned a different definition');
          await walk(detail, path);
        } catch (error) {
          if (signal.aborted) throw error;
          emit(
            stub,
            'unresolved',
            path,
            {},
            error instanceof Error
              ? error.message
              : 'Unresolved provider symbol',
          );
        }
      }
    };
    await walk(root, []);
    const trace: Trace = {
      version: 2,
      provider: 'codegraph-native',
      projectRoot: input.projectRoot,
      target: idOf(root),
      scenario: input.scenario ?? {},
      events,
      sourceHash: createHash('sha256')
        .update(evidence.join('\n'))
        .digest('hex'),
      diagnostics: [
        'CodeGraph indexed relationship walkthrough, not runtime execution. Event order is traversal order; stacks are graph paths.',
        'Scenario inputs are retained for context; native CodeGraph does not simulate them. No runtime values are fabricated.',
        'sourceHash fingerprints provider responses, not independently read project files.',
      ],
      truncated,
      filesAnalyzed: connection.files,
      cacheHits: 0,
    };
    if (truncated)
      trace.diagnostics.push(
        'Depth, event, provider-output or 100-request budget reached; not a full codebase trace.',
      );
    return traceToFlow(trace, input.target);
  } finally {
    await connection.close();
  }
}

// Preserve the complete provider response for host-AI simulation. This does not
// parse application syntax, execute source, or infer values from graph edges.
export async function readNativeEvidence(
  projectRoot: string,
  tool: 'explore' | 'node' | 'search' | 'callees' | 'files',
  args: Record<string, unknown>,
  signal: AbortSignal,
) {
  const connection = await connect({ projectRoot, target: 'evidence' }, signal);
  try {
    const name = 'codegraph_' + tool;
    if (!connection.tools.some((t) => t.name === name))
      throw new Error(
        `Installed CodeGraph does not expose ${name}; use an available evidence tool or update CodeGraph.`,
      );
    const text = await connection.call(name, {
      ...args,
      ...(tool === 'node' ? { includeCode: true } : {}),
    });
    return { text, files: connection.files, status: connection.status };
  } finally {
    await connection.close();
  }
}
