import test from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createMcpServer } from '../src/mcp/server.js';
import { FileSessionStore } from '../src/storage/file-session-store.js';

test('MCP tools/list advertises the exact builder and one-shot semantic group input contract', async () => {
  const store = await FileSessionStore.open(tmpdir(), {
    ttlMs: 60000,
    maxSessions: 10,
    maxSessionBytes: 1000000,
  });
  const server = createMcpServer(store, 'http://127.0.0.1:3456');
  const client = new Client({ name: 'semantic-schema-test', version: '1.0.0' });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  try {
    await server.connect(serverTransport);
    await client.connect(clientTransport);
    const { tools } = await client.listTools();
    const builder = tools.find(({ name }) => name === 'build_mock_animation')!;
    const oneShot = tools.find(
      ({ name }) => name === 'generate_mock_flow_animation',
    )!;
    const builderProperties = builder.inputSchema.properties as Record<
      string,
      any
    >;
    const definition = builderProperties.groupDefinitions.items;
    assert.equal(builderProperties.groupDefinitions.maxItems, 2000);
    assert.deepEqual(definition.required, [
      'key',
      'kind',
      'title',
      'certainty',
    ]);
    assert.ok(definition.properties.parentKey);
    assert.ok(definition.properties.source);
    assert.ok(definition.properties.evidenceIds);
    assert.ok(definition.properties.arm);
    assert.ok(definition.properties.iteration);
    assert.equal(
      builderProperties.operations.items.properties.groupPath.maxItems,
      2000,
    );
    const groups = (oneShot.inputSchema.properties as Record<string, any>)
      .semanticGroups;
    assert.equal(groups.maxItems, 2000);
    assert.ok(groups.items.properties.memberEventIds);
    assert.ok(groups.items.properties.parentGroupId);
    assert.ok(groups.items.properties.callId);
    assert.ok(groups.items.properties.taskId);
  } finally {
    await client.close();
    await server.close();
    await store.close();
  }
});
