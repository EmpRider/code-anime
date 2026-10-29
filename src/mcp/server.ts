import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { type SessionStore } from '../domain/flow.js';
import { eventSchema, semanticGroupSchema } from '../domain/trace.js';
import { AnimationBuilder } from '../services/animation-builder.js';
import { SimulationService } from '../services/simulation-service.js';
import { VisualizationService } from '../services/visualization-service.js';

const string = { type: 'string' };
const object = { type: 'object', additionalProperties: true };
// Keep advertised event kinds in sync with the actual trace validator. Agents
// build their requests from tools/list, so an omitted kind is unusable even
// when the server's event builder accepts it.
const eventKinds = eventSchema.shape.kind.options;
const groupKinds = semanticGroupSchema.innerType().shape.kind.options;
const groupKey = { type: 'string', minLength: 1, maxLength: 200 };
const groupSource = {
  type: 'object',
  additionalProperties: false,
  properties: {
    file: { type: 'string', minLength: 1, maxLength: 4096 },
    line: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
    endLine: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
    generated: {
      type: 'object',
      additionalProperties: false,
      properties: {
        file: { type: 'string', minLength: 1, maxLength: 4096 },
        line: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
      },
      required: ['file', 'line'],
    },
  },
  required: ['file', 'line', 'endLine'],
};
const groupMetadata = {
  kind: { type: 'string', enum: groupKinds },
  title: { type: 'string', minLength: 1, maxLength: 800 },
  source: groupSource,
  evidenceIds: { type: 'array', maxItems: 200, items: string },
  certainty: { type: 'string', enum: ['mock', 'assumed', 'unresolved'] },
  arm: {
    type: 'object',
    additionalProperties: false,
    properties: { id: groupKey, label: { type: 'string', maxLength: 800 } },
    required: ['id', 'label'],
  },
  iteration: { type: 'integer', minimum: 1, maximum: Number.MAX_SAFE_INTEGER },
};
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
  const builder = new AnimationBuilder(simulation, store);
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
        'Optional structural graph overview only; does not simulate values. For the default execution animation use read_codegraph_evidence then build_mock_animation begin/append/finish. Returns jobId; poll get_visualization_status.',
      inputSchema: schema(
        {
          provider: { type: 'string', enum: ['codegraph'] },
          projectRoot: string,
          target: string,
          scenario: object,
          maxDepth: { type: 'integer', minimum: 1 },
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
          maxDepth: { type: 'integer', minimum: 1 },
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
        'List sessions/jobs, cancel jobs, delete sessions/jobs, or import an existing user-supplied normalized export. Never create payload files to use import; use build_mock_animation for all new animations.',
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
        'Required first step for mock execution. Verify installed/indexed CodeGraph and retrieve full source, DTOs and relationships for the active project. Use explore for a natural-language flow/endpoint, node for complete source with file offset/limit, search for symbols. Follow nextOffset with evidenceId to read cached response pages. Returns evidenceId for build_mock_animation. Send operations directly; do not create scripts or payload files. Never reads/parses project source independently.',
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
      name: 'build_mock_animation',
      description:
        'Default script-free animation workflow. begin checks CodeGraph evidence. append accepts up to 100 mock operations, optional groupDefinitions with stable opaque keys and each operation’s outer-to-inner groupPath; the server assigns real event/call IDs and validates direct semantic memberships after append. CodeGraph receipts prove source retrieval, not a real executed branch. finish chunks, persists and returns the localhost player URL. Never create scripts or payload files. Retry the identical batchId/body safely.',
      inputSchema: schema(
        {
          action: {
            type: 'string',
            enum: ['begin', 'append', 'finish', 'status', 'cancel'],
          },
          projectRoot: string,
          endpoint: string,
          evidenceIds: { type: 'array', items: string },
          scenario: object,
          baselineSessionId: string,
          buildId: string,
          batchId: string,
          expectedEventCount: { type: 'integer', minimum: 0 },
          coverage: string,
          complete: { type: 'boolean' },
          operations: {
            type: 'array',
            minItems: 1,
            maxItems: 100,
            items: schema(
              {
                kind: {
                  type: 'string',
                  enum: eventKinds,
                },
                taskId: { type: 'string', minLength: 1, maxLength: 100 },
                label: string,
                symbol: string,
                source: schema(
                  {
                    file: string,
                    line: { type: 'integer', minimum: 1 },
                    endLine: { type: 'integer', minimum: 1 },
                    generated: schema(
                      {
                        file: string,
                        line: { type: 'integer', minimum: 1 },
                      },
                      ['file', 'line'],
                    ),
                  },
                  ['file', 'line', 'endLine'],
                ),
                line: { type: 'integer', minimum: 1 },
                evidenceIds: { type: 'array', items: string },
                inputs: object,
                result: {},
                output: { type: 'string', maxLength: 16000 },
                set: object,
                unset: { type: 'array', items: string },
                assignTo: string,
                unwindTo: {
                  type: ['string', 'null'],
                  description:
                    'For throw only: retain this active callId and unwind its callees; null unwinds all frames. Omit to keep the stack, for example while executing finally blocks. Follow with catch and set to bind the exception in the handler.',
                },
                objectId: string,
                fields: object,
                unsetFields: { type: 'array', items: string },
                values: object,
                origins: { type: 'object', additionalProperties: string },
                snippet: string,
                certainty: {
                  type: 'string',
                  enum: ['mock', 'assumed', 'unresolved', 'proposed'],
                },
                note: string,
                groupPath: { type: 'array', maxItems: 2000, items: groupKey },
              },
              ['kind', 'label'],
            ),
          },
          groupDefinitions: {
            type: 'array',
            maxItems: 2000,
            items: schema(
              {
                key: groupKey,
                parentKey: groupKey,
                ...groupMetadata,
              },
              ['key', 'kind', 'title', 'certainty'],
            ),
          },
        },
        ['action'],
      ),
    },
    {
      name: 'generate_mock_flow_animation',
      description:
        'Prefer build_mock_animation for automatic IDs. One-shot compatibility accepts fully formed CodeGraph-grounded mock events and optional semanticGroups with EXISTING local event IDs/call IDs, parent IDs, source receipts and simulated uncertainty; group membership is direct, not inherited. No executed branch truth is implied. For long traces use complete:false and continuationOf, repeating immutable ancestor groups with chunk-local members. Never create scripts or payload files.',
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
                  enum: eventKinds,
                },
                symbolId: string,
                label: string,
                callId: string,
                taskId: string,
                parentCallId: string,
                source: schema(
                  {
                    file: string,
                    line: { type: 'integer', minimum: 1 },
                    endLine: { type: 'integer', minimum: 1 },
                    generated: schema(
                      {
                        file: string,
                        line: { type: 'integer', minimum: 1 },
                      },
                      ['file', 'line'],
                    ),
                  },
                  ['file', 'line', 'endLine'],
                ),
                evidenceIds: { type: 'array', minItems: 1, items: string },
                values: object,
                inputs: object,
                result: {},
                output: string,
                before: object,
                after: object,
                objectId: string,
                origins: { type: 'object', additionalProperties: string },
                locals: object,
                objects: object,
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
          semanticGroups: {
            type: 'array',
            maxItems: 2000,
            items: schema(
              {
                id: groupKey,
                callId: groupKey,
                taskId: { type: 'string', minLength: 1, maxLength: 100 },
                parentGroupId: groupKey,
                memberEventIds: {
                  type: 'array',
                  maxItems: 2000,
                  items: groupKey,
                },
                ...groupMetadata,
              },
              ['id', 'kind', 'title', 'callId', 'memberEventIds', 'certainty'],
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
              maxDepth: z.number().int().min(1).optional(),
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
        case 'build_mock_animation':
          result = await builder.run(raw);
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
    builder.close();
    simulation.close();
  };
  return server;
}
