import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { readFileSync } from 'node:fs';
import { type SessionStore } from '../domain/flow.js';
import { AnimationBuilder } from '../services/animation-builder.js';
import { SimulationService } from '../services/simulation-service.js';
import { VisualizationService } from '../services/visualization-service.js';
import { RecordingService } from '../services/recording-service.js';

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
  const builder = new AnimationBuilder(simulation, store);
  const recorder = new RecordingService(store, baseUrl, (root) =>
    service.root(root),
  );
  const server = new Server(
    { name: 'code-anime', version },
    { capabilities: { tools: {} } },
  );
  const tools = [
    {
      name: 'record_execution',
      description:
        'Execute a trusted Python entry file and record actual synchronous main-thread events. This runs application code with local permissions and real side effects; use only when the user requests execution. No CodeGraph or AI-generated steps required. Returns jobId; use status to get progress and a prepared player URL, cancel to stop and retain partial evidence. Supports Python calls, source lines (pre-execution state), bounded locals, returns, exceptions and text output. Generators/coroutines stop with an explicit unsupported boundary. Other languages still use structural/mock workflows.',
      inputSchema: schema(
        {
          action: { type: 'string', enum: ['start', 'status', 'cancel'] },
          language: { type: 'string', enum: ['python'] },
          projectRoot: string,
          entry: string,
          args: { type: 'array', items: string },
          jobId: string,
          timeoutMs: { type: 'integer', minimum: 100, maximum: 300000 },
          maxEvents: { type: 'integer', minimum: 10, maximum: 100000 },
          maxTraceBytes: { type: 'integer', minimum: 4096, maximum: 67108864 },
        },
        ['action'],
      ),
    },
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
        'Default script-free animation workflow. begin creates a server-owned build after CodeGraph evidence checks. append accepts up to 100 compact semantic operations directly as MCP arguments; server generates event/call IDs, stack, complete locals/object snapshots and before/after states. No Python/JS scripts, shell commands, generated programs, or JSON payload files. finish automatically chunks, persists and returns the localhost player URL. Retry append with the same batchId/body safely. Use status/cancel as needed.',
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
                    'catch',
                    'unresolved',
                    'plan',
                  ],
                },
                label: string,
                symbol: string,
                source: schema(
                  {
                    file: string,
                    line: { type: 'integer', minimum: 1 },
                    endLine: { type: 'integer', minimum: 1 },
                  },
                  ['file', 'line', 'endLine'],
                ),
                line: { type: 'integer', minimum: 1 },
                evidenceIds: { type: 'array', items: string },
                inputs: object,
                result: {},
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
              },
              ['kind', 'label'],
            ),
          },
        },
        ['action'],
      ),
    },
    {
      name: 'generate_mock_flow_animation',
      description:
        'For normal flows prefer build_mock_animation so the server handles bookkeeping. Do not create scripts or payload files. One-shot compatibility: render the host AI’s CodeGraph-grounded, statement-by-statement mock execution. Include transforms (trim/min), assignments, DTO fields, branch/loop decisions, calls/returns, complete locals and stack snapshots. CodeGraph evidence receipts are mandatory. Use before/after for state changes. Values are simulated, not live execution. For large traces submit chunks with complete:false then continuationOf. For visual plans supply baselineSessionId and a full proposed scenario.',
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
                    'catch',
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
        case 'record_execution':
          result = await recorder.run(raw);
          break;
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
    recorder.close();
    service.close();
    builder.close();
    simulation.close();
  };
  return server;
}
