import { readFile } from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { z } from 'zod';
import type { Transport } from '@modelcontextprotocol/sdk/shared/transport.js';
import { traceSchema } from '../domain/trace.js';
import { traceToFlow, type AnalysisInput } from './contract.js';

const configSchema = z.discriminatedUnion('transport', [
  z
    .object({
      transport: z.literal('stdio'),
      command: z.string().min(1),
      args: z.array(z.string()).default([]),
      toolName: z.string().min(1),
    })
    .strict(),
  z
    .object({
      transport: z.literal('http'),
      url: z.string().url(),
      toolName: z.string().min(1),
    })
    .strict(),
]);
// CodeGraph implementations differ. Configure a documented normalization bridge;
// never infer a vendor's tool name or silently accept an incompatible graph.
export async function analyzeWithCodeGraph(
  configPath: string,
  input: AnalysisInput,
  signal: AbortSignal,
) {
  const config = configSchema.parse(
    JSON.parse(await readFile(configPath, 'utf8')),
  );
  const client = new Client({ name: 'code-anime-provider', version: '0.2.0' });
  const transport =
    config.transport === 'stdio'
      ? new StdioClientTransport({
          command: config.command,
          args: config.args,
          stderr: 'pipe',
        })
      : new StreamableHTTPClientTransport(new URL(config.url));
  try {
    // SDK HTTP transport has an optional-property declaration mismatch under exactOptionalPropertyTypes.
    await client.connect(transport as Transport);
    if (signal.aborted) throw new Error('Analysis cancelled');
    const { provider: _provider, ...argumentsValue } = input;
    const response = await client.callTool(
      { name: config.toolName, arguments: argumentsValue },
      undefined,
      { signal, timeout: 60000 },
    );
    if (response.isError) throw new Error('CodeGraph provider tool failed');
    const block = (
      response.content as Array<{ type: string; text?: string }>
    ).find((b) => b.type === 'text' && b.text);
    const raw =
      response.structuredContent ??
      (block?.text ? JSON.parse(block.text) : undefined);
    const trace = traceSchema.parse(raw);
    if (!trace.events.length)
      throw new Error('Provider returned no trace events');
    trace.provider = 'codegraph-bridge: ' + trace.provider;
    trace.diagnostics.push(
      'Provider-supplied evidence; source provenance depends on the configured bridge.',
    );
    return traceToFlow(trace, input.target);
  } finally {
    await client.close();
  }
}
