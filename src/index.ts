#!/usr/bin/env node
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp/server.js';
import { startRuntime } from './runtime.js';

async function main() {
  const runtime = await startRuntime();
  const mcp = createMcpServer(runtime.store, runtime.baseUrl);
  let stopping = false;
  const stop = async () => {
    if (stopping) return;
    stopping = true;
    try {
      await mcp.close();
      await runtime.close();
    } catch (error) {
      console.error('[code-anime] Cleanup failed:', error);
      process.exitCode = 1;
    }
  };
  process.once('SIGINT', () => {
    void stop();
  });
  process.once('SIGTERM', () => {
    void stop();
  });
  const closeService = mcp.onclose;
  mcp.onclose = () => {
    closeService?.();
    void stop();
  };
  try {
    await mcp.connect(new StdioServerTransport());
  } catch (error) {
    await runtime.close();
    throw error;
  }
  console.error('[code-anime] Player listening at ' + runtime.baseUrl);
}
main().catch((error: unknown) => {
  console.error('[code-anime] Startup failed:', error);
  process.exitCode = 1;
});
