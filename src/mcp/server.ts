import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { flowSchema, type SessionStore } from '../domain/flow.js';

export function createMcpServer(store: SessionStore, baseUrl: string): Server {
  const server = new Server(
    { name: 'code-anime', version: '0.1.0' },
    { capabilities: { tools: {} } },
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: 'generate_mock_flow_animation',
        description:
          'Display an agent-authored code flow with mock parameters in a local replay player. This tool does not analyze source code or execute the application.',
        inputSchema: {
          type: 'object',
          additionalProperties: false,
          properties: {
            endpoint: { type: 'string', minLength: 1, maxLength: 200 },
            steps: {
              type: 'array',
              minItems: 1,
              maxItems: 2000,
              items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                  from: { type: 'string', minLength: 1, maxLength: 200 },
                  to: { type: 'string', minLength: 1, maxLength: 200 },
                  dtoName: { type: 'string', minLength: 1, maxLength: 200 },
                  dtoFields: { type: 'object' },
                },
                required: ['from', 'to', 'dtoName', 'dtoFields'],
              },
            },
          },
          required: ['endpoint', 'steps'],
        },
      },
    ],
  }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name !== 'generate_mock_flow_animation')
      return {
        isError: true,
        content: [{ type: 'text', text: 'Unknown tool' }],
      };
    try {
      const flow = flowSchema.parse(request.params.arguments);
      const session = await store.create(flow);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              sessionId: session.id,
              url: baseUrl + '/flow/' + session.id,
              steps: flow.steps.length,
              dataSource: 'agent-authored mock flow',
            }),
          },
        ],
      };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text:
              error instanceof Error ? error.message : 'Could not create flow',
          },
        ],
      };
    }
  });
  return server;
}
