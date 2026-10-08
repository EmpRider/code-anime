import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { type SessionStore } from '../domain/flow.js';
import { SimulationService } from '../services/simulation-service.js';
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
  projectRoot = process.env.CODE_ANIME_PROJECT_ROOT,
): Server {
  const version = (
    JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { version: string }
  ).version;
  const service = new VisualizationService(store, baseUrl, projectRoot);
  const simulation = new SimulationService(store, baseUrl, (root) =>
    service.root(root),
  );
  const server = new Server(
    { name: 'code-anime', version },
    { capabilities: { tools: {} } },
  );
  const tools = [
    {
      name: 'visualizer_capabilities',
      description:
        'Check required CodeGraph configuration, project boundary and replay limits.',
      inputSchema: schema({}),
    },
    {
      name: 'visualize_code_flow',
      description:
        'Optional structural graph overview only; does not simulate values. For the default execution animation use read_codegraph_evidence then generate_mock_flow_animation. Returns jobId; poll get_visualization_status.',
      inputSchema: schema(
        {
          provider: { type: 'string', enum: ['codegraph'] },
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
      name: 'read_codegraph_evidence',
      description:
        'Required first step for mock execution. Verify installed/indexed CodeGraph and retrieve full source, DTOs and relationships for the active project. Use explore for a natural-language flow/endpoint, node for complete source with file offset/limit, search for symbols. Follow nextOffset with evidenceId to read cached response pages. Returns evidenceId required by generate_mock_flow_animation. Never reads/parses project source independently.',
      inputSchema: schema(
        {
          projectRoot: string,
          tool: {
            type: 'string',
            enum: ['explore', 'node', 'search', 'callees', 'files'],
          },
          arguments: object,
          evidenceId: string,
          offset: { type: 'integer', minimum: 0 },
          limit: { type: 'integer', minimum: 100, maximum: 32000 },
        },
        ['projectRoot'],
      ),
    },
    {
      name: 'generate_mock_flow_animation',
      description:
        'Render the host AI’s CodeGraph-grounded, statement-by-statement mock execution. Include transforms (trim/min), assignments, DTO fields, branch/loop decisions, calls/returns, complete locals and stack snapshots. CodeGraph evidence receipts are mandatory. Use before/after for state changes. Values are simulated, not live execution. For large traces submit chunks with complete:false then continuationOf. For visual plans supply baselineSessionId and a full proposed scenario.',
      inputSchema: schema(
        {
          projectRoot: string,
          endpoint: string,
          evidenceIds: {
            type: 'array',
            minItems: 1,
            maxItems: 200,
            items: string,
          },
          scenario: object,
          coverage: string,
          complete: { type: 'boolean' },
          continuationOf: string,
          baselineSessionId: string,
          events: {
            type: 'array',
            minItems: 1,
            maxItems: 2000,
            items: schema(
              {
                id: string,
                kind: {
                  type: 'string',
                  enum: [
                    'enter',
                    'call',
                    'return',
                    'assign',
                    'transform',
                    'mutate',
                    'branch',
                    'loop',
                    'await',
                    'throw',
                    'unresolved',
                    'plan',
                  ],
                },
                symbolId: string,
                label: string,
                callId: string,
                parentCallId: string,
                source: schema(
                  {
                    file: string,
                    line: { type: 'integer', minimum: 1 },
                    endLine: { type: 'integer', minimum: 1 },
                  },
                  ['file', 'line', 'endLine'],
                ),
                evidenceIds: { type: 'array', minItems: 1, items: string },
                values: object,
                inputs: object,
                result: {},
                before: object,
                after: object,
                objectId: string,
                origins: { type: 'object', additionalProperties: string },
                locals: object,
                snippet: { type: 'string', maxLength: 800 },
                stack: { type: 'array', items: string },
                certainty: {
                  type: 'string',
                  enum: ['mock', 'assumed', 'unresolved', 'proposed'],
                },
                note: string,
              },
              [
                'id',
                'kind',
                'symbolId',
                'label',
                'callId',
                'evidenceIds',
                'values',
                'locals',
                'stack',
                'certainty',
              ],
            ),
          },
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
        ['projectRoot', 'endpoint', 'evidenceIds', 'coverage'],
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
        case 'read_codegraph_evidence':
          result = await simulation.read(raw);
          break;
        case 'generate_mock_flow_animation':
          result = await simulation.submit(raw);
          break;
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
  server.onclose = () => {
    service.close();
    simulation.close();
  };
  return server;
}
