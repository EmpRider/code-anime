import assert from 'node:assert/strict';
import { test } from 'node:test';
import { tmpdir } from 'node:os';
import { flowSchema } from '../src/domain/flow.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';
import { startRuntime } from '../src/runtime.js';
import { readConfig } from '../src/config.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp/server.js';
const flow = flowSchema.parse({
  endpoint: '/login',
  steps: [
    {
      from: '<script>test</script>',
      to: 'service',
      dtoName: 'Request',
      dtoFields: { id: 1 },
    },
  ],
});
const options = { ttlMs: 3600000, maxSessionBytes: 100000, maxSessions: 2 };
test('contract rejects empty flows and wrong field types', () => {
  assert.equal(
    flowSchema.safeParse({ endpoint: '/login', steps: [] }).success,
    false,
  );
  assert.equal(
    flowSchema.safeParse({
      ...flow,
      steps: [{ ...flow.steps[0], dtoFields: 'wrong' }],
    }).success,
    false,
  );
});
test('storage isolates instances, validates IDs and enforces concurrent quota', async () => {
  const a = await FileSessionStore.open(tmpdir(), options);
  const b = await FileSessionStore.open(tmpdir(), options);
  try {
    const results = await Promise.allSettled([
      a.create(flow),
      a.create(flow),
      a.create(flow),
    ]);
    assert.equal(results.filter((r) => r.status === 'fulfilled').length, 2);
    const session = await b.create(flow);
    await assert.rejects(b.get('../secret'));
    await a.close();
    assert.deepEqual((await b.get(session.id))?.flow, flow);
  } finally {
    await a.close();
    await b.close();
  }
});
test('storage enforces byte limit and expiry', async () => {
  const small = await FileSessionStore.open(tmpdir(), {
    ...options,
    maxSessionBytes: 1,
  });
  const short = await FileSessionStore.open(tmpdir(), { ...options, ttlMs: 1 });
  try {
    await assert.rejects(small.create(flow), /size limit/);
    const session = await short.create(flow);
    await new Promise((resolve) => setTimeout(resolve, 5));
    assert.equal(await short.get(session.id), undefined);
    assert.equal(await short.latest(), undefined);
  } finally {
    await small.close();
    await short.close();
  }
});
test('HTTP serves flow, redirects latest and safely serves static player', async () => {
  const runtime = await startRuntime({ ...readConfig({}), port: 0 });
  try {
    assert.match(await (await fetch(runtime.baseUrl)).text(), /No active flow/);
    const session = await runtime.store.create(flow);
    assert.deepEqual(
      await (await fetch(runtime.baseUrl + '/api/flow/' + session.id)).json(),
      flow,
    );
    const redirect = await fetch(runtime.baseUrl, { redirect: 'manual' });
    assert.equal(redirect.headers.get('location'), '/flow/' + session.id);
    assert.equal(
      (await fetch(runtime.baseUrl + '/api/flow/invalid')).status,
      400,
    );
    assert.equal(
      (
        await fetch(
          runtime.baseUrl + '/api/flow/00000000-0000-4000-8000-000000000000',
        )
      ).status,
      404,
    );
    const page = await fetch(runtime.baseUrl + '/flow/' + session.id);
    assert.match(
      page.headers.get('content-security-policy') ?? '',
      /script-src 'self'/,
    );
    assert.doesNotMatch(await page.text(), /<script>test/);
    assert.equal((await fetch(runtime.baseUrl + '/player.js')).status, 200);
  } finally {
    await runtime.close();
    await runtime.close();
  }
});
test('MCP handshake and valid/invalid tool calls', async () => {
  const previousCommand = process.env.CODE_ANIME_CODEGRAPH_COMMAND;
  process.env.CODE_ANIME_CODEGRAPH_COMMAND = 'codegraph-does-not-exist';
  const previousConfig = process.env.CODE_ANIME_CODEGRAPH_CONFIG;
  delete process.env.CODE_ANIME_CODEGRAPH_CONFIG;
  const store = await FileSessionStore.open(tmpdir(), options);
  const server = createMcpServer(store, 'http://127.0.0.1:3456');
  const client = new Client({ name: 'test', version: '1.0.0' });
  const [ct, st] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(st);
    await client.connect(ct);
    assert.equal(
      (await client.listTools()).tools.find(
        (t) => t.name === 'generate_mock_flow_animation',
      )?.name,
      'generate_mock_flow_animation',
    );
    const blocked = await client.callTool({
      name: 'visualize_code_flow',
      arguments: {
        projectRoot: tmpdir(),
        target: 'AnyLanguage.run',
      },
    });
    assert.equal(blocked.isError, true);
    assert.match(
      (blocked.content as Array<{ text: string }>)[0]!.text,
      /CodeGraph is required/,
    );
    const listing = await client.callTool({
      name: 'manage_visualization',
      arguments: { action: 'list' },
    });
    assert.deepEqual(
      JSON.parse((listing.content as Array<{ text: string }>)[0]!.text),
      { jobs: [], sessions: [] },
    );
    const result = await client.callTool({
      name: 'generate_mock_flow_animation',
      arguments: flow,
    });
    assert.notEqual(result.isError, true);
    const blocks = result.content as Array<{ text: string }>;
    const data = JSON.parse(blocks[0]!.text) as { sessionId: string };
    assert.ok(await store.get(data.sessionId));
    const invalid = await client.callTool({
      name: 'generate_mock_flow_animation',
      arguments: { endpoint: '/login', steps: [] },
    });
    assert.equal(invalid.isError, true);
  } finally {
    await client.close();
    await server.close();
    await store.close();
    if (previousCommand === undefined)
      delete process.env.CODE_ANIME_CODEGRAPH_COMMAND;
    else process.env.CODE_ANIME_CODEGRAPH_COMMAND = previousCommand;
    if (previousConfig === undefined)
      delete process.env.CODE_ANIME_CODEGRAPH_CONFIG;
    else process.env.CODE_ANIME_CODEGRAPH_CONFIG = previousConfig;
  }
});
