import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createWebApp } from '../src/web/app.ts';

const vendor = new URL('../public/vendor/', import.meta.url);
const expectedDigest =
  'e4f5c51c6f2fd564bb64e52e81c4a85a316ef2f24f8b90e1db5eb886c765b030';

test('build emits the byte-identical upstream elkjs 0.12.0 Worker', async () => {
  const worker = await readFile(new URL('elk-worker.min.js', vendor));
  assert.equal(worker.byteLength, 1595334);
  assert.equal(
    createHash('sha256').update(worker).digest('hex'),
    expectedDigest,
  );
});

test('redistribution includes the original EPL license and source-availability statement', async () => {
  const license = await readFile(new URL('elkjs/LICENSE.md', vendor), 'utf8');
  const source = await readFile(
    new URL('elkjs/SOURCE-AVAILABILITY.md', vendor),
    'utf8',
  );
  assert.match(license, /^# Eclipse Public License - v 2\.0/);
  assert.match(source, /ff5771d7165445c42c408bb8a090c8035272218c/);
  assert.match(source, /eclipse-elk\/elk/);
});

test('the packed vendor notice discloses unverified source and third-party inventory', async () => {
  const notice = await readFile(new URL('elkjs/NOTICE.md', vendor), 'utf8');
  assert.match(notice, /EPL-2\.0 OR GPL-3\.0-or-later/);
  assert.match(
    notice,
    /e4f5c51c6f2fd564bb64e52e81c4a85a316ef2f24f8b90e1db5eb886c765b030/,
  );
  assert.match(notice, /UNVERIFIED/);
  assert.match(notice, /third-party/);
});

test('same-origin Worker is served with strict CSP, JavaScript MIME and nosniff; missing assets 404', async () => {
  const app = createWebApp({
    latest: async () => undefined,
    get: async () => undefined,
  });
  const server = createServer(app);
  try {
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    assert.ok(address && typeof address !== 'string');
    const base = `http://127.0.0.1:${address.port}`;
    const worker = await fetch(`${base}/vendor/elk-worker.min.js`);
    assert.equal(worker.status, 200);
    assert.match(worker.headers.get('content-type') ?? '', /javascript/i);
    assert.equal(worker.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(
      worker.headers.get('content-security-policy'),
      "default-src 'self'; script-src 'self'; style-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
    );
    assert.equal(
      createHash('sha256')
        .update(Buffer.from(await worker.arrayBuffer()))
        .digest('hex'),
      expectedDigest,
    );
    assert.equal(
      (await fetch(`${base}/vendor/elk-worker-missing.js`)).status,
      404,
    );
  } finally {
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
