import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'node:url';

test('desktop source fills its grid row instead of leaving unused space', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.setContent(`
    <main class="workspace inspector-collapsed timeline-collapsed">
      <div class="center-column show-flow">
        <section class="panel source-panel">
          <header class="panel-heading"><h2>Source walkthrough</h2></header>
          <div class="source-code">${Array.from({ length: 100 }, (_, i) => `<div>Source line ${i + 1}</div>`).join('')}</div>
        </section>
        <div id="source-flow-divider"></div>
        <section id="flow-panel" class="panel flow-panel"></section>
        <details id="console-panel" class="panel console-panel"><summary>Console</summary></details>
      </div>
    </main>
  `);
  await page.addStyleTag({
    path: fileURLToPath(new URL('../../public/styles.css', import.meta.url)),
  });
  for (const height of [900, 730]) {
    await page.setViewportSize({ width: 1536, height });
    for (const focused of [false, true]) {
      await page
        .locator('.workspace')
        .evaluate(
          (node, value) => node.classList.toggle('source-focused', value),
          focused,
        );
      const panel = (await page.locator('.source-panel').boundingBox())!;
      const row =
        (await page.locator('#source-flow-divider').boundingBox()) ??
        (await page.locator('.center-column').boundingBox())!;
      const code = (await page.locator('.source-code').boundingBox())!;
      expect(panel.height).toBeGreaterThan(row.height - 50);
      expect(code.height).toBeGreaterThan(panel.height - 90);
      expect(code.height).toBeGreaterThan(200);
      expect(
        Math.abs(code.y + code.height - panel.y - panel.height),
      ).toBeLessThan(3);
    }
  }
});
