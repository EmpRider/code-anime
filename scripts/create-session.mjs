import { FileSessionStore } from '../src/storage/file-session-store.js';
import { readConfig } from '../src/config.js';
import { readFileSync } from 'fs';
const config = readConfig();
const store = await FileSessionStore.open(config.tempRoot, config);
const raw = JSON.parse(readFileSync('examples/login-flow.json', 'utf8'));
const flow = {
  endpoint: raw.endpoint,
  steps: raw.steps,
  trace: {
    version: 2,
    provider: 'mock',
    projectRoot: '.',
    sourceHash: 'mock-hash',
    target: raw.endpoint,
    scenario: {},
    diagnostics: [],
    truncated: false,
    filesAnalyzed: 0,
    cacheHits: 0,
    events: [],
  },
  baselineSessionId: undefined,
};
const session = await store.create(flow);
console.log('SESSION_ID=' + session.id);
process.exit(0);
