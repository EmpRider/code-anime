import type { FlowData } from '../types/flow';

/** Fetches flow session data from the backend REST API.
 * Mirrors GET /api/flow/:id in src/web/app.ts.
 * Called by src/App.tsx on mount to load the current session. */
export async function fetchFlow(sessionId: string): Promise<FlowData> {
  const res = await fetch(`/api/flow/${sessionId}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Failed to load flow: ${res.status}`);
  }
  return res.json();
}

/** Seeds a dummy test session for development.
 * Mirrors POST /api/test-session in src/web/app.ts. */
export async function createTestSession(): Promise<{ sessionId: string }> {
  const res = await fetch('/api/test-session', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create test session');
  return res.json();
}