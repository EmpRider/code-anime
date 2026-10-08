import { readFile } from 'node:fs/promises';
import { flowSchema } from '../src/domain/flow.js';
import { startRuntime } from '../src/runtime.js';

const runtime = await startRuntime();
try {
  const flow = flowSchema.parse(
    JSON.parse(
      await readFile(
        new URL('../examples/login-flow.json', import.meta.url),
        'utf8',
      ),
    ),
  );
  const session = await runtime.store.create(flow);
  console.log('Demo player: ' + runtime.baseUrl + '/flow/' + session.id);
  for (const signal of ['SIGINT', 'SIGTERM'] as const)
    process.once(signal, () => {
      void runtime.close();
    });
} catch (error) {
  await runtime.close();
  throw error;
}
