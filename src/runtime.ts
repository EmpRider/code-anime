import { createServer } from 'node:http';
import { readConfig, type Config } from './config.js';
import { FileSessionStore } from './storage/file-session-store.js';
import { createWebApp } from './web/app.js';

export async function startRuntime(config: Config = readConfig()) {
  const store = await FileSessionStore.open(config.tempRoot, config);
  const server = createServer(createWebApp(store));
  try {
    await new Promise<void>((resolve, reject) => {
      server.once('error', reject);
      server.listen(config.port, '127.0.0.1', () => {
        server.off('error', reject);
        resolve();
      });
    });
  } catch (error) {
    await store.close();
    throw error;
  }
  const address = server.address();
  if (!address || typeof address === 'string')
    throw new Error('HTTP server has no TCP address');
  const baseUrl = 'http://127.0.0.1:' + address.port;
  let shutdown: Promise<void> | undefined;
  const close = () =>
    (shutdown ??= (async () => {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
      await store.close();
    })());
  return { store, baseUrl, close };
}
