import { createHash } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { traceToFlow, type AnalysisInput, CandidateError } from './contract.js';
import type { Trace, TraceEvent } from '../domain/trace.js';
import { resolveCodeGraphLaunch } from './codegraph-launcher.js';
import { sourceBoundary } from '../services/source-catalog.js';

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
  const sections = [
    ...text.matchAll(/^(?:\*\*(.+?)\*\*|## (.+?)) \([\w_]+\)\r?\n/gm),
  ];
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
      name: (match[1] ?? match[2])!,
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
function scopedCalleeEvidence(response: string, node: SymbolInfo) {
  if (/Aggregated results across \d+ symbols/i.test(response))
    throw new Error(
      'CodeGraph merged callees from different definitions; this provider cannot isolate the requested method',
    );
  if (/no definition.*matches file/i.test(response))
    throw new Error('CodeGraph ignored the requested definition file');
  if (!/distinct definitions/i.test(response))
    return { text: response, unscopedCount: false };
  // Each named definition has its own section. Neither its edges nor its
  // coverage count may be borrowed from a different same-named method.
  const headings = [
    ...response.matchAll(/^\*\*(.+?)\*\* \([\w_]+\) — (.+?):(\d+)\s*$/gm),
  ];
  const index = headings.findIndex(
    (m) => m[2] === node.file && Number(m[3]) === node.line,
  );
  if (index < 0)
    throw new Error(
      'CodeGraph returned ambiguous callee definitions; narrow the target',
    );
  const text = response.slice(
    headings[index]!.index!,
    headings[index + 1]?.index ?? response.length,
  );
  return {
    text,
    unscopedCount:
      /Showing [\d,]+ of [\d,]+/i.test(response) &&
      !/Showing [\d,]+ of [\d,]+/i.test(text),
  };
}
async function connect(input: AnalysisInput, signal: AbortSignal) {
  const prefix: unknown = JSON.parse(
    process.env.CODE_ANIME_CODEGRAPH_ARGS || '[]',
  );
  if (!Array.isArray(prefix) || prefix.some((arg) => typeof arg !== 'string'))
    throw new Error(
      'CODE_ANIME_CODEGRAPH_ARGS must be a JSON array of strings',
    );
  const client = new Client({ name: 'code-anime', version: '0.5.0' });
  const launcher = resolveCodeGraphLaunch(
    process.env.CODE_ANIME_CODEGRAPH_COMMAND || 'codegraph',
    prefix,
  );
  const transport = new StdioClientTransport({
    command: launcher.command,
    args: [...launcher.args, 'serve', '--mcp', '--path', input.projectRoot],
    cwd: input.projectRoot,
    env: {
      ...process.env,
      CODEGRAPH_MCP_TOOLS: 'status,node,callees,search,explore,files',
      CODEGRAPH_NO_WATCH: '1',
      CODEGRAPH_NO_DAEMON: '1',
    },
    stderr: 'pipe',
  });
  // Drain provider logs without contaminating MCP stdout or accumulating memory.
  transport.stderr?.on('data', () => {});
  let closing: Promise<void> | undefined;
  // connect() can detach the client after a failed handshake; the transport
  // still owns the spawned process and must always be closed explicitly.
  const closeClient = () => (closing ??= transport.close());
  const abort = () => {
    void closeClient().catch(() => {});
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
    // Some versions hide status/callees for small repositories while still
    // supporting their documented calls. Verify status by calling it below.
    for (const tool of ['codegraph_node']) {
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
    clearTimeout(timer); // Startup budget; individual requests retain their own timeout.
    return {
      client,
      call,
      tools: listed.tools,
      status,
      files: Number(count[1]),
      close: async () => {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        await closeClient();
      },
    };
  } catch (error) {
    clearTimeout(timer);
    signal.removeEventListener('abort', abort);
    await closeClient().catch(() => {});
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
  connectProvider: (
    input: AnalysisInput,
    signal: AbortSignal,
  ) => Promise<
    Pick<
      Awaited<ReturnType<typeof connect>>,
      'call' | 'status' | 'files' | 'close'
    >
  > = connect,
) {
  const connection = await connectProvider(input, signal);
  try {
    const evidence: string[] = [connection.status];
    const getNode = async (target: Record<string, unknown>) => {
      const text = await connection.call('codegraph_node', {
        ...target,
        includeCode: true,
      });
      evidence.push(text);
      const nodes = parseNodes(text).filter(
        (node) =>
          (target.file === undefined || node.file === target.file) &&
          (target.line === undefined || node.line === target.line),
      );
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
    const rootBoundary = sourceBoundary(input.projectRoot, root.file);
    if (rootBoundary)
      throw new Error(
        `Selected CodeGraph entry ${idOf(root)} is outside user-written project source: ${rootBoundary}`,
      );
    const events: TraceEvent[] = [];
    const expanded = new Set<string>();
    let truncated = false;
    const boundaries = new Set<string>();
    const incomplete = (reason: string) => {
      truncated = true;
      boundaries.add(reason);
    };
    const maxEvents = input.maxEvents ?? 2000;
    // Depth is unlimited by default. Any boundary must be caller-specified;
    // the event budget and provider timeout remain resource safeguards.
    const maxDepth = input.maxDepth ?? Infinity;
    const emit = (
      node: SymbolInfo,
      kind: 'enter' | 'call' | 'unresolved',
      stack: string[],
      values: Record<string, unknown>,
      note: string,
    ) => {
      if (events.length >= maxEvents) {
        incomplete(`Event budget ${maxEvents} reached before ${idOf(node)}.`);
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
      if (stack.length >= maxDepth || events.length >= maxEvents) {
        incomplete(
          `Traversal boundary at ${idOf(node)}: depth ${stack.length}/${maxDepth}, events ${events.length}/${maxEvents}.`,
        );
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
      // Start with a small response, but grow the request when CodeGraph may
      // have more relationships than it returned. The event budget is the
      // actual capacity boundary, rather than an arbitrary 100-callee cap.
      const relationshipBudget = Math.max(1, maxEvents - events.length);
      let requested = Math.min(100, relationshipBudget);
      let text = '';
      let previousCount = -1;
      let relationshipBoundary = false;
      const knownRelationships = new Set<string>();
      let changedRelationships = false;
      for (;;) {
        let response: string;
        try {
          response = await connection.call('codegraph_callees', {
            symbol: node.name,
            file: node.file,
            limit: requested,
          });
        } catch (error) {
          if (signal.aborted || !text) throw error;
          relationshipBoundary = true;
          incomplete(
            `CodeGraph could not expand callee evidence for ${idOf(node)} to ${requested} relationships: ${error instanceof Error ? error.message : String(error)}.`,
          );
          break;
        }
        evidence.push(response);
        const scoped = scopedCalleeEvidence(response, node);
        response = scoped.text;
        if (scoped.unscopedCount)
          incomplete(
            `CodeGraph reported a shared callee count for different definitions of ${idOf(node)}; selected method coverage is unverified.`,
          );
        const rawRows = [
          ...response.matchAll(
            /^- .+? \([\w_]+\) - .+:\d+(?: — via .+)?\s*$/gm,
          ),
        ].map((match) => match[0].trimEnd());
        // Repeated identical rows cannot establish distinct call edges.
        // Count unique relationships when checking provider completeness.
        const rows = [...new Set(rawRows)];
        const count = rows.length;
        if (count < rawRows.length)
          incomplete(
            `CodeGraph repeated ${rawRows.length - count} identical callee relationships for ${idOf(node)}; distinct relationship coverage cannot be verified.`,
          );
        // A larger request must retain previously returned relationships.
        // An unstable provider response is partial evidence even if it claims
        // to contain the entire graph.
        if (
          knownRelationships.size &&
          [...knownRelationships].some((row) => !rows.includes(row))
        ) {
          changedRelationships = true;
          incomplete(
            `CodeGraph changed previously returned callee relationships for ${idOf(node)}; retaining all retrieved evidence and marking coverage incomplete.`,
          );
        }
        for (const row of rows) knownRelationships.add(row);
        if (previousCount >= 0 && count < previousCount) {
          relationshipBoundary = true;
          incomplete(
            `CodeGraph returned only ${count} relationships for ${idOf(node)} after previously returning ${previousCount}; retaining the larger evidence set.`,
          );
          break;
        }
        text = response;
        const shown = text.match(/Showing ([\d,]+) of ([\d,]+)/i);
        const reportedCount = shown
          ? Number(shown[1]!.replaceAll(',', ''))
          : undefined;
        const total = shown ? Number(shown[2]!.replaceAll(',', '')) : undefined;
        // A truncated/invalid provider payload can claim complete coverage
        // despite containing fewer edges than its own reported row count.
        if (reportedCount !== undefined && count < reportedCount) {
          relationshipBoundary = true;
          incomplete(
            `CodeGraph reported ${reportedCount} relationships for ${idOf(node)} but returned only ${count} parseable rows; coverage cannot be verified.`,
          );
          break;
        }
        const explicitlyTruncated =
          (reportedCount !== undefined && reportedCount < total!) ||
          /(?:… \+|truncated)/i.test(text);
        const potentiallyFull = count >= requested && !shown;
        if (!explicitlyTruncated && !potentiallyFull) break;
        if (requested >= relationshipBudget || count <= previousCount) {
          relationshipBoundary = true;
          break;
        }
        previousCount = count;
        requested = Math.min(
          relationshipBudget,
          Math.max(requested * 2, total ?? 0),
        );
      }
      if (changedRelationships) {
        const finalRows = new Set(
          [
            ...text.matchAll(/^- .+? \([\w_]+\) - .+:\d+(?: — via .+)?\s*$/gm),
          ].map((match) => match[0].trimEnd()),
        );
        for (const row of knownRelationships) {
          if (!finalRows.has(row)) text += `\n${row}`;
        }
      }
      const links = [
        ...new Map(
          [
            ...text.matchAll(
              /^- (.+?) \(([\w_]+)\) - (.+?):(\d+)(?: — via (.+))?\s*$/gm,
            ),
          ].map((match) => [match[0].trimEnd(), match] as const),
        ).values(),
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
      if (relationshipBoundary)
        incomplete(
          `CodeGraph callee coverage for ${idOf(node)} stopped after requesting ${requested} relationships (event capacity ${maxEvents}); additional relationships may exist.`,
        );
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
        if (events.length >= maxEvents) {
          incomplete(
            `Event budget ${maxEvents} reached while expanding ${idOf(node)}.`,
          );
          break;
        }
        const stub: SymbolInfo = { ...child, snippet: '', members: [] };
        const boundary = sourceBoundary(input.projectRoot, child.file);
        emit(
          stub,
          'call',
          path,
          { from: idOf(node), to: idOf(stub), relationship: child.relation },
          boundary
            ? `Source boundary (${boundary}); implementation intentionally not expanded`
            : 'Indexed relationship; order and runtime values are unknown',
        );
        // Keep the indexed call visible but never expand third-party,
        // generated, sensitive, or out-of-project implementations.
        if (boundary) continue;
        if (path.length >= maxDepth) {
          incomplete(
            `Depth budget ${maxDepth} prevented expansion of ${idOf(stub)}.`,
          );
          continue;
        }
        // Static graph expansion is per symbol. Recursion and repeated call
        // relationships are represented, but never called observed execution.
        if (expanded.has(idOf(stub))) continue;
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
          incomplete(
            `Could not expand ${idOf(stub)}: ${error instanceof Error ? error.message : 'Unresolved provider symbol'}`,
          );
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
    try {
      await walk(root, []);
    } catch (error) {
      if (signal.aborted) throw error;
      const reason =
        error instanceof Error ? error.message : 'Provider traversal failed';
      incomplete(`Could not finish traversal from ${idOf(root)}: ${reason}`);
      emit(root, 'unresolved', [idOf(root)], {}, reason);
    }
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
        ...boundaries,
      ],
      truncated,
      filesAnalyzed: connection.files,
      cacheHits: 0,
    };
    if (truncated)
      trace.diagnostics.push(
        'The configured depth, event resource budget, or provider-output boundary was reached; graph coverage is incomplete.',
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
    if (
      !['callees', 'files'].includes(tool) &&
      !connection.tools.some((t) => t.name === name)
    )
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
