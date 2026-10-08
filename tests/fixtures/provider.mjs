import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
const server = new Server(
  { name: 'fixture-provider', version: '1' },
  { capabilities: { tools: {} } },
);
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [{ name: 'fixture_trace', inputSchema: { type: 'object' } }],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => ({
  content: [
    {
      type: 'text',
      text: JSON.stringify({
        version: 2,
        provider: 'fixture',
        projectRoot: request.params.arguments.projectRoot,
        sourceHash: 'fixture-hash',
        target: 'fixture',
        scenario: {},
        events: [
          {
            id: '1',
            kind: 'enter',
            symbolId: 'fixture',
            label: 'fixture',
            callId: '1',
            stack: ['fixture'],
            values: {},
            certainty: 'static',
          },
        ],
        diagnostics: [],
        truncated: false,
        filesAnalyzed: 1,
        cacheHits: 0,
      }),
    },
  ],
}));
await server.connect(new StdioServerTransport());
