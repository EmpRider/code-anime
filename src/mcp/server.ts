import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { flowSchema, type SessionStore } from '../domain/flow.js';
import { VisualizationService } from '../services/visualization-service.js';

const string = { type: 'string' };
const object = { type: 'object', additionalProperties: true };
const schema = (
  properties: Record<string, unknown>,
  required: string[] = [],
) => ({ type: 'object', additionalProperties: false, properties, required });
export function createMcpServer(
  store: SessionStore,
  baseUrl: string,
  projectRoot = process.env.CODE_ANIME_PROJECT_ROOT ?? process.cwd(),
): Server {
  const version = (
    JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { version: string }
  ).version;
  const service = new VisualizationService(store, baseUrl, projectRoot);
  const server = new Server(
    { name: 'code-anime', version },
    { capabilities: { tools: {} } },
  );
  const tools = [
    {
      name: 'visualizer_capabilities',
      description:
        'Discover analysis languages, configured project root, limits and provider support.',
      inputSchema: schema({}),
    },
    {
      name: 'visualize_code_flow',
      description:
        'Analyze local TypeScript/JavaScript source automatically and create an evidence-backed scenario replay. Return a jobId; poll get_visualization_status. No application code is executed.',
      inputSchema: schema(
        {
          provider: { type: 'string', enum: ['source', 'codegraph'] },
          projectRoot: string,
          target: string,
          scenario: object,
          maxDepth: { type: 'integer', minimum: 1, maximum: 30 },
          maxEvents: { type: 'integer', minimum: 10, maximum: 2000 },
        },
        ['projectRoot', 'target'],
      ),
    },
    {
      name: 'get_visualization_status',
      description:
        'Get job progress, target candidates, errors or the completed player URL.',
      inputSchema: schema({ jobId: string }, ['jobId']),
    },
    {
      name: 'inspect_visualization',
      description:
        'Read a bounded page of trace events, source locations, stack snapshots, values and uncertainty.',
      inputSchema: schema(
        {
          sessionId: string,
          offset: { type: 'integer', minimum: 0 },
          limit: { type: 'integer', minimum: 1, maximum: 50 },
        },
        ['sessionId'],
      ),
    },
    {
      name: 'refine_visualization',
      description:
        'Re-analyze an existing job with scenario parameters or a deeper bound. Produces a new job and session.',
      inputSchema: schema(
        {
          sessionId: string,
          scenario: object,
          maxDepth: { type: 'integer', minimum: 1, maximum: 30 },
        },
        ['sessionId', 'scenario'],
      ),
    },
    {
      name: 'visualize_change_plan',
      description:
        'Overlay proposed transitions on an analyzed baseline. Proposed events are marked and never edit source code.',
      inputSchema: schema(
        {
          sessionId: string,
          changes: {
            type: 'array',
            minItems: 1,
            maxItems: 100,
            items: schema({ from: string, to: string, description: string }, [
              'from',
              'to',
              'description',
            ]),
          },
        },
        ['sessionId', 'changes'],
      ),
    },
    {
      name: 'manage_visualization',
      description:
        'List sessions/jobs, cancel jobs, delete sessions/jobs, or import a normalized trace export. Import does not directly call a vendor CodeGraph API.',
      inputSchema: schema(
        {
          action: {
            type: 'string',
            enum: ['list', 'cancel', 'delete', 'delete_job', 'import'],
          },
          id: string,
          file: string,
        },
        ['action'],
      ),
    },
    {
      name: 'generate_mock_flow_animation',
      description:
        'Legacy compatibility: render an agent-authored mock flow. Prefer visualize_code_flow for server-owned source analysis.',
      inputSchema: schema(
        {
          endpoint: string,
          steps: {
            type: 'array',
            minItems: 1,
            maxItems: 2000,
            items: schema(
              { from: string, to: string, dtoName: string, dtoFields: object },
              ['from', 'to', 'dtoName', 'dtoFields'],
            ),
          },
        },
        ['endpoint', 'steps'],
      ),
    },
  ];
  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const raw = request.params.arguments ?? {};
      let result: unknown;
      switch (request.params.name) {
        case 'visualizer_capabilities':
          z.object({}).strict().parse(raw);
          result = service.capabilities();
          break;
        case 'visualize_code_flow':
          result = await service.start(raw);
          break;
        case 'get_visualization_status': {
          const p = z.object({ jobId: z.string().uuid() }).strict().parse(raw);
          result = service.status(p.jobId);
          break;
        }
        case 'inspect_visualization': {
          const p = z
            .object({
              sessionId: z.string().uuid(),
              offset: z.number().int().min(0).default(0),
              limit: z.number().int().min(1).max(50).default(20),
            })
            .strict()
            .parse(raw);
          result = await service.inspect(p.sessionId, p.offset, p.limit);
          break;
        }
        case 'refine_visualization': {
          const p = z
            .object({
              sessionId: z.string().uuid(),
              scenario: z.record(z.unknown()),
              maxDepth: z.number().int().min(1).max(30).optional(),
            })
            .strict()
            .parse(raw);
          result = await service.refine(p.sessionId, p.scenario, p.maxDepth);
          break;
        }
        case 'visualize_change_plan': {
          const p = z
            .object({
              sessionId: z.string().uuid(),
              changes: z
                .array(
                  z
                    .object({
                      from: z.string().min(1).max(200),
                      to: z.string().min(1).max(200),
                      description: z.string().min(1).max(200),
                    })
                    .strict(),
                )
                .min(1)
                .max(100),
            })
            .strict()
            .parse(raw);
          result = await service.plan(p.sessionId, p.changes);
          break;
        }
        case 'manage_visualization': {
          const p = z
            .object({
              action: z.enum([
                'list',
                'cancel',
                'delete',
                'delete_job',
                'import',
              ]),
              id: z.string().uuid().optional(),
              file: z.string().optional(),
            })
            .strict()
            .parse(raw);
          if (p.action === 'import') {
            if (!p.file) throw new Error('file is required');
            result = await service.importTrace(p.file);
          } else result = await service.manage(p.action, p.id);
          break;
        }
        case 'generate_mock_flow_animation': {
          const flow = flowSchema.parse(raw);
          const session = await store.create(flow);
          result = {
            sessionId: session.id,
            url: baseUrl + '/flow/' + session.id,
            steps: flow.steps.length,
            dataSource: 'agent-authored mock flow',
          };
          break;
        }
        default:
          throw new Error('Unknown tool');
      }
      return { content: [{ type: 'text', text: JSON.stringify(result) }] };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text:
              error instanceof Error ? error.message : 'Visualization failed',
          },
        ],
      };
    }
  });
  server.onclose = () => service.close();
  return server;
}
