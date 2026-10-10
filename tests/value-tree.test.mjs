import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import {
  buildFlowOverview,
  describeFlowTransition,
} from '../public/flow-overview.js';
import { replayState } from '../public/replay.js';
import { prepareSourceHighlighting } from '../public/source-highlighter.js';
import { plainTerminalText } from '../public/terminal-text.js';

test('large object inspectors load bounded pages and retain disclosure through historical replay', async () => {
  const [html, source] = await Promise.all([
    readFile(new URL('../public/index.html', import.meta.url), 'utf8'),
    readFile(new URL('../public/player.js', import.meta.url), 'utf8'),
  ]);
  const wide = Object.fromEntries(
    Array.from({ length: 1500 }, (_, index) => [`field${index}`, index]),
  );
  let deep = { end: '<img src=x onerror=alert(1)>' };
  for (let index = 0; index < 900; index++) deep = { next: deep };
  const first = {
    wide,
    deep,
    nested: { before: 'same', changed: { value: 1 } },
  };
  const second = {
    ...first,
    wide: { ...wide, field1499: 1500 },
    nested: { before: 'same', changed: { value: 2 } },
  };
  const events = [
    { kind: 'enter', after: first },
    { kind: 'mutate', before: first, after: second },
  ].map((values, index) => ({
    ...values,
    id: `event-${index + 1}`,
    symbolId: 'main',
    label: `Event ${index + 1}`,
    callId: 'frame',
    stack: ['frame'],
    locals: { frame: values.after.wide },
    values: {},
    certainty: 'mock',
  }));
  const flow = {
    endpoint: 'Large values',
    trace: { events, diagnostics: [] },
    steps: events.map((event) => ({
      from: 'main',
      to: 'main',
      dtoName: event.label,
      dtoFields: event.after,
    })),
  };
  const dom = new JSDOM(html, {
    url: 'http://127.0.0.1/flow/large-values',
    runScripts: 'outside-only',
  });
  try {
    const { window } = dom;
    const get = (id) => window.document.getElementById(id);
    window.replayState = replayState;
    window.prepareSourceHighlighting = prepareSourceHighlighting;
    window.buildFlowOverview = buildFlowOverview;
    window.describeFlowTransition = describeFlowTransition;
    window.plainTerminalText = plainTerminalText;
    let requests = 0;
    window.fetch = async () => {
      requests++;
      return { ok: true, json: async () => flow };
    };
    window.matchMedia = () => ({ matches: true });
    window.HTMLElement.prototype.scrollIntoView = () => {};
    window.eval(source.replace(/^import .*;\r?\n/gm, ''));
    for (let i = 0; i < 40 && get('progress').textContent !== '0 / 2'; i++)
      await new Promise((resolve) => setTimeout(resolve, 5));

    get('next').click();
    const tree = get('fields');
    assert.ok(tree.querySelectorAll('.field, .object-fields').length < 100);
    assert.equal(get('local-tree').querySelectorAll('.field').length, 60);
    assert.ok(get('local-tree').querySelector('.value-more'));
    const wideGroup = [...tree.querySelectorAll('details')].find((group) =>
      group.querySelector(':scope > summary')?.textContent.startsWith('wide'),
    );
    assert.ok(wideGroup);
    assert.equal(wideGroup.open, false);
    wideGroup.querySelector('summary').click();
    assert.equal(wideGroup.open, true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.ok(wideGroup.textContent.includes('field59:'));
    assert.ok(!wideGroup.textContent.includes('field60:'));
    assert.equal(wideGroup.querySelectorAll('.field').length, 60);
    wideGroup.querySelector('.value-more').click();
    assert.equal(wideGroup.querySelectorAll('.field').length, 120);
    assert.ok(wideGroup.textContent.includes('field60:'));
    assert.ok(!wideGroup.textContent.includes('field120:'));

    get('next').click();
    assert.equal(get('progress').textContent, '2 / 2');
    assert.match(tree.textContent, /value: 1 → 2/);
    get('changes-only').click();
    const nested = [...tree.querySelectorAll('details')].find((group) =>
      group.querySelector(':scope > summary')?.textContent.startsWith('nested'),
    );
    assert.ok(nested);
    assert.ok(nested.classList.contains('has-changes'));
    assert.match(tree.textContent, /value: 1 → 2/);
    assert.doesNotMatch(tree.textContent, /before: "same"/);
    assert.equal(tree.querySelectorAll('.field').length, 2);
    const filteredWide = [...tree.querySelectorAll('details')].find((group) =>
      group.querySelector(':scope > summary')?.textContent.startsWith('wide'),
    );
    assert.ok(filteredWide?.classList.contains('has-changes'));
    if (!filteredWide.open) {
      filteredWide.querySelector('summary').click();
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    assert.match(filteredWide.textContent, /field1499: 1499 → 1500/);
    assert.equal(filteredWide.querySelectorAll('.field').length, 1);
    assert.equal(get('progress').textContent, '2 / 2');
    get('changes-only').click();
    assert.ok(tree.querySelectorAll('.field').length < 200);
    assert.equal(
      [...tree.querySelectorAll('details')]
        .find((group) =>
          group
            .querySelector(':scope > summary')
            ?.textContent.startsWith('wide'),
        )
        .querySelectorAll('.field').length,
      120,
      'switching filters preserves the unfiltered page count',
    );

    get('previous').click();
    const restoredWide = [...tree.querySelectorAll('details')].find((group) =>
      group.querySelector(':scope > summary')?.textContent.startsWith('wide'),
    );
    assert.equal(restoredWide.open, true);
    assert.equal(restoredWide.querySelectorAll('.field').length, 120);
    assert.equal(tree.querySelector('img'), null);
    assert.equal(requests, 1, 'disclosure and replay must use stored values');
  } finally {
    dom.window.close();
  }
});
