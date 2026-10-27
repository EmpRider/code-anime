#!/usr/bin/env node
import { createServer } from 'node:http';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createMcpServer } from './mcp/server.js';
import { FileSessionStore } from './storage/file-session-store.js';
import { createWebApp } from './web/app.js';
import { readConfig } from './config.js';

async function main() {
  const config = readConfig();
  const store = await FileSessionStore.open(config.tempRoot, config);

  // 1. Start HTTP server FIRST to capture real port (fast, <100ms)
  const server = createServer(createWebApp(store));
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.port, '127.0.0.1', () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('HTTP server has no TCP address');
  const baseUrl = 'http://127.0.0.1:' + address.port;

  // 2. Create MCP server with REAL URL (not placeholder)
  const mcp = createMcpServer(store, baseUrl);
  let stopping = false;

  const stop = async () => {
    if (stopping) return;
    stopping = true;
    try {
      await mcp.close();
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await store.close();
    } catch (error) {
      console.error('[code-anime] Cleanup failed:', error);
      process.exitCode = 1;
    }
  };

  process.once('SIGINT', () => void stop());
  process.once('SIGTERM', () => void stop());

  const closeService = mcp.onclose;
  mcp.onclose = () => {
    closeService?.();
    void stop();
  };

  // 3. Connect stdio IMMEDIATELY after HTTP is ready (satisfies 30s handshake timeout)
  try {
    await mcp.connect(new StdioServerTransport());
  } catch (error) {
    await stop();
    throw error;
  }

  console.error('[code-anime] Player listening at ' + baseUrl);
}

main().catch((error: unknown) => {
  console.error('[code-anime] Startup failed:', error);
  process.exitCode = 1;
});
