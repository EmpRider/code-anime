import express, { type ErrorRequestHandler } from 'express';
import { fileURLToPath } from 'node:url';
import { sessionIdSchema, type SessionStore } from '../domain/flow.js';

const publicDirectory = fileURLToPath(
  new URL('../../public/', import.meta.url),
);
export function createWebApp(store: SessionStore) {
  const app = express();
  app.disable('x-powered-by');
  app.use((_req, res, next) => {
    res.set({
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Content-Security-Policy':
        "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    });
    next();
  });
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });
  app.get('/', async (_req, res) => {
    const latest = await store.latest();
    if (latest) {
      res.redirect('/flow/' + latest.id);
      return;
    }
    res
      .type('html')
      .send(
        '<h1>Code Anime</h1><p>No active flow. Ask your AI agent to call generate_mock_flow_animation, or run npm run demo.</p>',
      );
  });
  app.get('/api/flow/:id', async (req, res) => {
    const parsed = sessionIdSchema.safeParse(req.params.id);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid session ID' });
      return;
    }
    const session = await store.get(parsed.data);
    if (!session) {
      res.status(404).json({ error: 'Session expired or not found' });
      return;
    }
    res.json(session.flow);
  });
  app.get('/flow/:id', (req, res) => {
    if (!sessionIdSchema.safeParse(req.params.id).success) {
      res.status(400).send('Invalid session ID');
      return;
    }
    res.sendFile(publicDirectory + '/index.html');
  });
  app.use(express.static(publicDirectory));
  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });
  const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
    console.error('[code-anime] Web request failed:', error);
    res.status(500).json({ error: 'Could not load flow' });
  };
  app.use(handleError);
  return app;
}
