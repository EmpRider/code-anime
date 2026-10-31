import { test, expect, type Page } from "@playwright/test";
import { createServer, type Server } from "node:http";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { build, normalizePath } from "vite";
import { createWebApp } from "../../src/web/app.js";
import type { SessionStore } from "../../src/domain/flow.js";

// CA059 CI1: HARNESS_SMOKE_ONLY. One of at most two authorized confirming CI
// cycles. No label-clearance, foreign-stroke, keyboard/ARIA, nine-chain, 10k,
// CA060/CSP or FE acceptance may be inferred from this test.
const baselinePath = fileURLToPath(
  new URL("../fixtures/v3/proposed-baseline.json", import.meta.url),
);
const nestedPath = fileURLToPath(
  new URL("../fixtures/v3/nested-multilingual.json", import.meta.url),
);
const rendererPath = fileURLToPath(
  new URL("../../public/v3-scene-diagram.js", import.meta.url),
);
const geometryPath = fileURLToPath(
  new URL("../../public/v3-scene-geometry.js", import.meta.url),
);
const SCRIPT_PATH = "/__ca059_harness_smoke.js";
const STYLE_PATH = "/__ca059_harness_smoke.css";
const LABELS = [
  ["e:xz:a", "parallel A", 736.5, 133, 80, 26],
  ["e:xz:b", "parallel B", 745.5, 76, 80, 26],
  ["e:wx", "sibling-to-inner", 301, 160, 116, 26],
  ["e:yw", "return-to-sibling", 264.5, 194, 122, 26],
  ["e:zw", "external-to-sibling", 385.5, 13, 134, 26],
] as const;
let server: Server;
let baseUrl: string;

function collapseVariant() {
  const variant = structuredClone(
    JSON.parse(readFileSync(baselinePath, "utf8")).variantsById.proposed,
  );
  const node = variant.graph.nodes[0];
  const edge = variant.graph.edges[0];
  const group = JSON.parse(readFileSync(nestedPath, "utf8")).variantsById
    .proposed.graph.groups[0];
  variant.graph.groups = [
    { ...group, id: "outer", parentGroupId: null, memberNodeIds: ["W"] },
    {
      ...group,
      id: "inner",
      parentGroupId: "outer",
      memberNodeIds: ["X", "Y"],
    },
  ];
  variant.graph.nodes = [
    { ...node, id: "X", groupPathIds: ["outer", "inner"], order: 0 },
    { ...node, id: "Y", groupPathIds: ["outer", "inner"], order: 1 },
    { ...node, id: "W", groupPathIds: ["outer"], order: 2 },
    { ...node, id: "Z", groupPathIds: [], order: 3 },
  ];
  variant.graph.edges = [
    ["e:xy", "X", "Y", "inner-only"],
    ["e:xz:a", "X", "Z", "parallel A"],
    ["e:xz:b", "X", "Z", "parallel B"],
    ["e:wx", "W", "X", "sibling-to-inner"],
    ["e:yw", "Y", "W", "return-to-sibling"],
    ["e:zw", "Z", "W", "external-to-sibling"],
  ].map(([id, fromNodeId, toNodeId, label], index) => ({
    ...edge,
    id,
    fromNodeId,
    toNodeId,
    label,
    certainty: index % 2 ? "unresolved" : "mock",
  }));
  variant.artifact.revision = "revision:collapse";
  return variant;
}

function boundedJson(value: unknown): string {
  const output = JSON.stringify(value);
  if (typeof output !== "string")
    throw new Error("CA059_UNRESOLVED_HARNESS: invalid JSON evidence");
  if (Buffer.byteLength(output, "utf8") <= 16 * 1024) return output;
  const fallback = JSON.stringify({
    status: "UNRESOLVED_LIMIT",
    reason: "case output exceeded 16KiB UTF8",
    originalBytes: Buffer.byteLength(output, "utf8"),
  });
  if (Buffer.byteLength(fallback, "utf8") > 16 * 1024)
    throw new Error("CA059_UNRESOLVED_LIMIT: even fallback JSON too large");
  return fallback;
}

type CspEvent = {
  directive: string;
  blockedUri: string;
  source: string;
  timingMs: number;
};
type StyleInsertion = {
  contentLength: number;
  contentHash: string;
  createFrame: string;
  timingMs: number;
};
function classifyCsp(events: CspEvent[], styles: StyleInsertion[]) {
  // CA060's separately measured source-linked X6 core style is precisely
  // 2,854 UTF-16 code units and FNV-1a a73d50ec. Neither "inline" alone nor
  // an X6-looking script name alone exempts a new CSP violation.
  const candidates = events.filter(
    (event) =>
      event.directive === "style-src-elem" && event.blockedUri === "inline",
  );
  const matchingStyles = candidates.map((event) =>
    styles.flatMap((style, index) =>
      style.contentLength === 2854 &&
      style.contentHash === "a73d50ec" &&
      event.source.length > 0 &&
      style.createFrame.includes(event.source) &&
      Math.abs(style.timingMs - event.timingMs) < 1500
        ? [index]
        : [],
    ),
  );
  const usedStyles = new Set<number>();
  let matchingAssignments = 0;
  let searchAttempts = 0;
  let ambiguousOrOverLimit = false;
  const countMatches = (eventIndex: number): void => {
    if (matchingAssignments > 1 || ambiguousOrOverLimit) return;
    if (eventIndex === candidates.length) {
      matchingAssignments++;
      return;
    }
    const candidateStyleIndexes = matchingStyles[eventIndex];
    if (candidateStyleIndexes === undefined) {
      ambiguousOrOverLimit = true;
      return;
    }
    for (const styleIndex of candidateStyleIndexes) {
      if (++searchAttempts > 20_000) {
        ambiguousOrOverLimit = true;
        return;
      }
      if (usedStyles.has(styleIndex)) continue;
      usedStyles.add(styleIndex);
      countMatches(eventIndex + 1);
      usedStyles.delete(styleIndex);
      if (matchingAssignments > 1 || ambiguousOrOverLimit) return;
    }
  };
  if (candidates.length === styles.length && candidates.length > 0)
    countMatches(0);
  const everyInsertionIsSourceLinkedX6 =
    candidates.length > 0 &&
    styles.length === candidates.length &&
    matchingAssignments === 1 &&
    !ambiguousOrOverLimit;
  const knownSeparateCA060Signature = everyInsertionIsSourceLinkedX6
    ? candidates
    : [];
  const unexpected = events.filter(
    (event) => !knownSeparateCA060Signature.includes(event),
  );
  return {
    knownSeparateCA060Signature,
    unexpected,
    attribution:
      candidates.length > 0 && !everyInsertionIsSourceLinkedX6
        ? "UNKNOWN_CSP_SOURCE"
        : "SOURCE_LINKED_X6_CORE_ONLY",
    styleInsertionCount: styles.length,
    sourceMatchCount: matchingAssignments,
    sourceMatchAttempts: searchAttempts,
    ca060Status: "SEPARATE_RED_NOT_VERIFIED_BY_CA059",
  };
}

async function bundleSmoke() {
  const entry = "virtual:ca059-harness-entry";
  const entryId = "\0" + entry;
  const helperId = "\0virtual:ca059-harness-helper";
  let expectedRootId: string | undefined;
  const placements = Object.fromEntries(
    LABELS.map(([, text, x, y, width, height]) => [
      text,
      { x, y, width, height },
    ]),
  );
  let aliasHits = 0;
  const helperSource = [
    "const placements = " + JSON.stringify(placements) + ";",
    "export function reserveRouteLabel(points,text,obstacles,reservations) {",
    "  if (!Array.isArray(points) || points.length < 2 || !Array.isArray(reservations))",
    '    throw Error("CA059_UNRESOLVED_HARNESS: invalid helper signature");',
    "  const selected = placements[String(text)];",
    '  if (!selected) throw Error("CA059_ALIAS_NEGATIVE_REJECTED:" + String(text));',
    "  (window.__ca059AliasCalls ??= []).push(String(text));",
    "  const box = {...selected}; reservations.push(box); return box;",
    "}",
  ].join("\n");
  const entrySource = [
    'import { Graph } from "@antv/x6";',
    "import { renderV3Scene } from " + JSON.stringify(rendererPath) + ";",
    "import { createV3SceneLayout } from " + JSON.stringify(geometryPath) + ";",
    'import { reserveRouteLabel } from "virtual:ca059-direct-helper";',
    "let layout,rendered;",
    String.raw`
function ca066TextMatches(expected, candidate) {
  if (typeof expected !== "string" || typeof candidate !== "string") return false;
  const model = Array.from(expected), dom = Array.from(candidate);
  return model.length === dom.length && model.every((char, i) =>
    char === dom[i] || (char === " " && dom[i] === "\u00a0"));
}
function ca066PaintColor(value) {
  const color = String(value ?? "").trim().toLowerCase();
  const colorCall = color.match(/^(rgb|rgba)\(([^()]*)\)$/);
  if (!colorCall) return false;
  const slashParts = colorCall[2].split("/");
  if (slashParts.length > 2) return false;
  const parts = slashParts[0].includes(",")
    ? slashParts[0].split(",").map((part) => part.trim())
    : slashParts[0].trim().split(/\s+/);
  let alphaText;
  if (slashParts.length === 2 && parts.length === 3) alphaText = slashParts[1].trim();
  else if (colorCall[1] === "rgba" && parts.length === 4) alphaText = parts.pop();
  else if (colorCall[1] !== "rgb" || parts.length !== 3) return false;
  const numeric = /^(?:\d+(?:\.\d+)?|\.\d+)%?$/;
  if (!parts.every((part) => numeric.test(part))) return false;
  if (alphaText === undefined) return true;
  if (!numeric.test(alphaText)) return false;
  const alpha = Number.parseFloat(alphaText) / (alphaText.endsWith("%") ? 100 : 1);
  return Number.isFinite(alpha) && alpha > 0 && alpha <= 1;
}
function ca066LocalPaint(element, root, kind) {
  for (let current = element; current instanceof Element; current = current.parentElement) {
    const style = getComputedStyle(current);
    const opacity = Number(style.opacity);
    if (style.display === "none" || style.visibility === "hidden" ||
        style.visibility === "collapse" || !Number.isFinite(opacity) || opacity <= 0)
      return false;
    if (kind === "text" && !(Number.parseFloat(style.fontSize) > 0)) return false;
  }
  const style = getComputedStyle(element);
  const stroke = ca066PaintColor(style.stroke) &&
    Number(style.strokeOpacity) > 0 && Number.parseFloat(style.strokeWidth) > 0;
  return kind === "path" ? stroke :
    (ca066PaintColor(style.fill) && Number(style.fillOpacity) > 0) || stroke;
}
function ca066FiniteMatrix(element) {
  const matrix = element.getScreenCTM?.();
  return !!matrix && [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f]
    .every(Number.isFinite);
}
function ca066InspectEdge(edge, oldExact = false) {
  const text = edge?.getLabels()?.[0]?.attrs?.label?.text;
  const view = edge && rendered?.graph?.findViewByCell(edge);
  const root = view?.container;
  const owner = (element) => root?.isConnected && element?.isConnected &&
    root.contains(element) && element.closest("[data-cell-id]")?.getAttribute("data-cell-id") === edge.id;
  if (!edge || !owner(root)) return {text, hasSvgPath:false, hasDomGlyph:false};
  // X6 edge markup maps selector "line" to its painted connector; "wrap" is transparent hit-target.
  const line = view.findOne("line");
  let routeLength = 0;
  try { routeLength = line?.getTotalLength?.() ?? 0; } catch { /* fail closed */ }
  const path = line?.tagName?.toLowerCase() === "path" && owner(line) &&
    ca066FiniteMatrix(line) && ca066LocalPaint(line, root, "path") &&
    Number.isFinite(routeLength) && routeLength > 0;
  const matches = Array.from(root.querySelectorAll("text")).filter((item) =>
    owner(item) && (oldExact ? item.textContent?.trim() === text : ca066TextMatches(text, item.textContent)));
  const glyph = matches.length === 1 ? matches[0] : null;
  let descendantsPaint = !!glyph;
  if (glyph) {
    const nodes = document.createTreeWalker(glyph, NodeFilter.SHOW_TEXT);
    for (let node = nodes.nextNode(); node; node = nodes.nextNode()) {
      const contributor = node.parentElement;
      const childRect = contributor?.getBoundingClientRect?.();
      if (node.textContent?.length &&
          (!owner(contributor) || !ca066LocalPaint(contributor, root, "text") ||
           !Number.isFinite(childRect?.width) || childRect.width <= 0 ||
           !Number.isFinite(childRect?.height) || childRect.height <= 0)) {
        descendantsPaint = false;
        break;
      }
    }
  }
  const rect = glyph?.getBoundingClientRect();
  return {text, hasSvgPath:!!path,
    hasDomGlyph:!!path && !!glyph && descendantsPaint &&
      ca066LocalPaint(glyph, root, "text") && ca066FiniteMatrix(glyph) &&
      Number.isFinite(rect?.width) && rect.width > 0 &&
      Number.isFinite(rect?.height) && rect.height > 0};
}
`,
    "window.__ca059Harness = {",
    "  inspectEdge(id, oldExact=false) { return ca066InspectEdge(rendered?.graph?.getCellById(id), oldExact); },",
    "  matchesText: ca066TextMatches,",
    "  paintColor: ca066PaintColor,",
    "  routeElement(id) { const edge=rendered?.graph?.getCellById(id); return edge && rendered.graph.findViewByCell(edge)?.findOne('line'); },",
    "  negative() {",
    '    try { reserveRouteLabel([{x:0,y:0},{x:1,y:1}],"__invalid_probe_label__",[],[]);',
    "      return {rejected:false};",
    "    } catch(error) {",
    '      return {rejected:String(error).includes("CA059_ALIAS_NEGATIVE_REJECTED"),',
    "        message:String(error).slice(0,120)};",
    "    }",
    "  },",
    "  async render(variant,state) {",
    "    window.__ca059AliasCalls = [];",
    "    layout = createV3SceneLayout();",
    "    const workerStart=performance.now();",
    "    const geometry = await layout.layout(variant,{...state,presentationState:state,timeoutMs:30000});",
    "    const workerMs=performance.now()-workerStart;",
    '    const canvas=document.getElementById("ca059-smoke-canvas");',
    '    if (!canvas) throw Error("CA059_UNRESOLVED_HARNESS: canvas missing");',
    "    const x6Start=performance.now();",
    "    rendered = await renderV3Scene(canvas,variant,geometry,state,{GraphClass:Graph});",
    "    rendered.graph.zoomToFit({padding:24});",
    "    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));",
    "    const seen=[];",
    "    for (const edge of rendered.graph.getEdges()) {",
    "      seen.push({id:edge.id,...ca066InspectEdge(edge)});",
    "    }",
    "    return {workerMs,x6Ms:performance.now()-x6Start,",
    "      scene:{width:geometry.width,height:geometry.height},",
    "      aliasCalls:[...(window.__ca059AliasCalls??[])],",
    '      domCells:canvas.querySelectorAll("[data-cell-id]").length,edges:seen};',
    "  },",
    "  dispose() {try {rendered?.dispose();} finally {layout?.dispose();}}",
    "};",
  ].join("\n");
  const output = await build({
    configFile: false,
    publicDir: false,
    logLevel: "error",
    plugins: [
      {
        name: "ca059-exact-renderer-import-smoke",
        enforce: "pre",
        configResolved(config) {
          expectedRootId = normalizePath(resolve(config.root, entry));
        },
        resolveId(id, importer, options) {
          if (id === entry) return entryId;
          if (id === "virtual:ca059-direct-helper") return helperId;
          if (
            id === "./diagram-label-placement.js" &&
            /[/\\]public[/\\]v3-scene-diagram\.js$/.test(importer ?? "")
          ) {
            aliasHits++;
            return helperId;
          }
          if (
            expectedRootId !== undefined &&
            id === expectedRootId &&
            importer == null &&
            options?.isEntry === true
          )
            return entryId;
        },
        load(id) {
          if (id === entryId) return entrySource;
          if (id === helperId) return helperSource;
        },
      },
    ],
    build: {
      write: false,
      emptyOutDir: false,
      minify: true,
      rollupOptions: { output: { inlineDynamicImports: true } },
      lib: {
        entry,
        formats: ["iife"],
        name: "CA059HarnessSmoke",
        fileName: () => "ca059-harness-smoke.js",
      },
    },
  });
  if (aliasHits !== 1)
    throw new Error(
      "CA059_UNRESOLVED_HARNESS: renderer-only Vite import alias hits=" +
        aliasHits,
    );
  const chunks = (Array.isArray(output) ? output : [output]).flatMap(
    (record) => ("output" in record ? record.output : []),
  );
  const chunk = chunks.find((item) => item.type === "chunk");
  if (
    !chunk ||
    chunk.type !== "chunk" ||
    Buffer.byteLength(chunk.code, "utf8") > 8 * 1024 * 1024
  )
    throw new Error(
      "CA059_UNRESOLVED_LIMIT: in-memory bundle missing/exceeds 8MiB",
    );
  return chunk.code;
}

async function mount(page: Page, code: string) {
  await page.route("**" + SCRIPT_PATH, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: code,
    }),
  );
  await page.route("**" + STYLE_PATH, (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/css",
      body: "html,body{margin:0;padding:0}#ca059-smoke-canvas{width:100vw;height:100vh;overflow:hidden}",
    }),
  );
  const response = await page.goto(baseUrl + "/v3-preview.html");
  expect(response?.status()).toBe(200);
  expect(response?.headers()["content-security-policy"]).toContain(
    "script-src 'self'",
  );
  expect(response?.headers()["content-security-policy"]).toContain(
    "style-src 'self'",
  );
  await page.evaluate(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/__ca059_harness_smoke.css";
    document.head.appendChild(link);
    const canvas = document.createElement("div");
    canvas.id = "ca059-smoke-canvas";
    document.body.replaceChildren(canvas);
  });
  await page.addScriptTag({ url: baseUrl + SCRIPT_PATH });
  expect(
    await page.evaluate(() => Boolean((window as any).__ca059Harness?.render)),
  ).toBe(true);
}

test.beforeAll(async () => {
  const store: SessionStore = {
    async create() {
      throw new Error("CA059 smoke never creates sessions");
    },
    async get() {
      return undefined;
    },
    async latest() {
      return undefined;
    },
    async close() {},
  };
  server = createServer(createWebApp(store));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string")
    throw new Error(
      "CA059_UNRESOLVED_HARNESS: ephemeral server port unavailable",
    );
  baseUrl = "http://127.0.0.1:" + address.port;
});

test.afterAll(async () => {
  server.closeAllConnections();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

test("CA059 CI1: renderer Vite alias + real Worker/ELK/X6 glyph smoke ONLY", async ({
  browser,
}, testInfo) => {
  testInfo.setTimeout(45_000);
  let status = "UNRESOLVED_HARNESS";
  let reason = "";
  let observed: unknown = null;
  const started = Date.now();
  const context = await browser.newContext({
    viewport: { width: 900, height: 600 },
  });
  try {
    const code = await bundleSmoke();
    const page = await context.newPage();
    await page.addInitScript(() => {
      (window as any).__ca059Csp = [];
      (window as any).__ca059Styles = [];
      (window as any).__ca059RecorderOverflow = false;
      const fingerprint = (value: string) => {
        let hash = 2166136261;
        for (let i = 0; i < value.length; i++) {
          hash ^= value.charCodeAt(i);
          hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0).toString(16).padStart(8, "0");
      };
      document.addEventListener(
        "securitypolicyviolation",
        (event) => {
          const records = (window as any).__ca059Csp;
          if (records.length >= 24) {
            (window as any).__ca059RecorderOverflow = true;
            return;
          }
          records.push({
            directive: event.effectiveDirective,
            blockedUri: event.blockedURI,
            source: event.sourceFile?.split("/").pop() ?? "",
            timingMs: Math.round(performance.now()),
          });
        },
        true,
      );
      const creation = new WeakMap<Element, string>();
      const originalCreateElement = document.createElement;
      document.createElement = function (
        this: Document,
        tagName: string,
        options?: ElementCreationOptions,
      ) {
        const element = originalCreateElement.call(this, tagName, options);
        if (tagName.toLowerCase() === "style")
          creation.set(element, (new Error().stack ?? "").split("\n")[2] ?? "");
        return element;
      } as typeof document.createElement;
      const captured = new WeakSet<Element>();
      const capture = (style: Element) => {
        if (captured.has(style)) return;
        captured.add(style);
        const records = (window as any).__ca059Styles;
        if (records.length >= 24) {
          (window as any).__ca059RecorderOverflow = true;
          return;
        }
        const content = style.textContent ?? "";
        records.push({
          contentLength: content.length,
          contentHash: fingerprint(content),
          createFrame: (creation.get(style) ?? "").slice(0, 180),
          timingMs: Math.round(performance.now()),
        });
      };
      new MutationObserver((changes) => {
        for (const change of changes)
          change.addedNodes.forEach((node) => {
            if (!(node instanceof Element)) return;
            if (node.tagName === "STYLE") capture(node);
            node.querySelectorAll("style").forEach(capture);
          });
      }).observe(document, { childList: true, subtree: true });
    });
    await mount(page, code);
    const negative = await page.evaluate(() =>
      (window as any).__ca059Harness.negative(),
    );
    expect(
      negative.rejected,
      "test-only helper must reject unknown label",
    ).toBe(true);
    const variant = collapseVariant();
    const state = {
      variantId: "proposed",
      orientation: "horizontal",
      viewport: { width: 800, height: 600 },
      collapsedGroupIds: ["inner"],
    };
    const probe = await page.evaluate(
      ({ variant, state }) =>
        (window as any).__ca059Harness.render(variant, state),
      { variant, state },
    );
    // CA066: each negative mutates the real X6 SVG, then restores it.
    // These controls must stay RED when a same-edge DOM glyph is not eligible.
    const ca066 = await page.evaluate(() => {
      const harness = (window as any).__ca059Harness;
      const owner = document.querySelector('[data-cell-id="e:xz:a"]');
      const foreign = document.querySelector('[data-cell-id="e:xz:b"]');
      const glyph = owner?.querySelector("text");
      if (!owner || !foreign || !glyph)
        throw Error("CA066_UNRESOLVED: real X6 edge text owner missing");
      const inspect = () => Boolean(harness.inspectEdge("e:xz:a").hasDomGlyph);
      const temporarily = (change: () => () => void) => {
        const undo = change();
        try {
          return inspect();
        } finally {
          undo();
        }
      };
      const swapText = (value: string) => () => {
        const nodes = Array.from(glyph.childNodes);
        glyph.replaceChildren(document.createTextNode(value));
        return () => glyph.replaceChildren(...nodes);
      };
      const originalCodePoints = Array.from(glyph.textContent ?? "", (char) =>
        char.codePointAt(0),
      );
      const originalExactRed = glyph.textContent?.trim() !== "parallel A";
      const oldComparatorNegative = !harness.inspectEdge("e:xz:a", true)
        .hasDomGlyph;
      const matcher = {
        plain: harness.matchesText("parallel A", "parallel A"),
        candidateNbsp: harness.matchesText("parallel A", "parallel\u00a0A"),
        modelNbspReverse: harness.matchesText("parallel\u00a0A", "parallel A"),
      };
      const paintColors = {
        opaqueBlackRgb: harness.paintColor("rgb(0, 0, 0)"),
        opaqueRedRgb: harness.paintColor("rgb(255, 0, 0)"),
        rgbaZeroAlpha: harness.paintColor("rgba(0, 0, 0, 0)"),
        rgbSlashZeroAlpha: harness.paintColor("rgb(255 0 0 / 0)"),
        none: harness.paintColor("none"),
        transparent: harness.paintColor("transparent"),
        unresolvedPaintServer: harness.paintColor("url(#missing)"),
      };
      const positive = inspect();
      const wrongLabel = temporarily(swapText("parallel C"));
      const doubledSpace = temporarily(swapText("parallel  A"));
      const narrowNoBreak = temporarily(swapText("parallel\u202fA"));
      const zeroWidthSpace = temporarily(swapText("parallel\u200bA"));
      const bidiChanged = temporarily(swapText("parallel\u202eA"));
      const duplicate = temporarily(() => {
        const copy = glyph.cloneNode(true);
        glyph.parentNode?.appendChild(copy);
        return () => copy.parentNode?.removeChild(copy);
      });
      const foreignOwner = temporarily(() => {
        const parent = glyph.parentNode;
        const next = glyph.nextSibling;
        foreign.appendChild(glyph);
        return () => parent?.insertBefore(glyph, next);
      });
      const nestedOwner = temporarily(() => {
        const parent = glyph.parentNode;
        const next = glyph.nextSibling;
        const wrapper = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "g",
        );
        wrapper.setAttribute("data-cell-id", "ca066-foreign-nested");
        parent?.insertBefore(wrapper, glyph);
        wrapper.appendChild(glyph);
        return () => {
          parent?.insertBefore(glyph, next);
          wrapper.remove();
        };
      });
      const hiddenChild = temporarily(() => {
        const nodes = Array.from(glyph.childNodes);
        const visible = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan",
        );
        visible.textContent = "parallel";
        const hidden = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan",
        );
        hidden.textContent = "\u00a0A";
        hidden.setAttribute("display", "none");
        glyph.replaceChildren(visible, hidden);
        return () => glyph.replaceChildren(...nodes);
      });
      const zeroFontChild = temporarily(() => {
        const nodes = Array.from(glyph.childNodes);
        const visible = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan",
        );
        visible.textContent = "parallel";
        const zeroFont = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "tspan",
        );
        zeroFont.textContent = "\u00a0A";
        zeroFont.style.fontSize = "0px";
        glyph.replaceChildren(visible, zeroFont);
        return () => glyph.replaceChildren(...nodes);
      });
      const transparentChild = temporarily(() => {
        const child = glyph.querySelector("tspan") ?? glyph;
        const opacity = child.style.getPropertyValue("opacity");
        const priority = child.style.getPropertyPriority("opacity");
        child.style.setProperty("opacity", "0", "important");
        return () =>
          opacity
            ? child.style.setProperty("opacity", opacity, priority)
            : child.style.removeProperty("opacity");
      });
      const zeroWidth = temporarily(() => {
        const previous = glyph.getAttribute("transform");
        glyph.setAttribute("transform", "scale(0, 1)");
        return () =>
          previous === null
            ? glyph.removeAttribute("transform")
            : glyph.setAttribute("transform", previous);
      });
      const zeroHeight = temporarily(() => {
        const previous = glyph.getAttribute("transform");
        glyph.setAttribute("transform", "scale(1, 0)");
        return () =>
          previous === null
            ? glyph.removeAttribute("transform")
            : glyph.setAttribute("transform", previous);
      });
      const route = harness.routeElement("e:xz:a") as SVGPathElement | null;
      const decoy = Array.from(owner.querySelectorAll("path")).find(
        (path) => path !== route,
      );
      if (!route || !decoy)
        throw Error(
          "CA066_UNRESOLVED: exact X6 line/wrap route mapping missing",
        );
      const setRouteStyle = (property: string, value: string) => () => {
        const previous = route.style.getPropertyValue(property);
        const priority = route.style.getPropertyPriority(property);
        route.style.setProperty(property, value, "important");
        return () =>
          previous
            ? route.style.setProperty(property, previous, priority)
            : route.style.removeProperty(property);
      };
      const transparentPath = temporarily(
        setRouteStyle("stroke", "transparent"),
      );
      const zeroRouteStrokeWidth = temporarily(
        setRouteStyle("stroke-width", "0"),
      );
      const zeroRouteStrokeOpacity = temporarily(
        setRouteStyle("stroke-opacity", "0"),
      );
      const hiddenRouteWithPaintedDecoy = temporarily(() => {
        const restoreRoute = setRouteStyle("display", "none")();
        const previousStroke = decoy.style.getPropertyValue("stroke");
        const previousPriority = decoy.style.getPropertyPriority("stroke");
        decoy.style.setProperty("stroke", "rgb(255, 0, 0)", "important");
        return () => {
          restoreRoute();
          if (previousStroke)
            decoy.style.setProperty("stroke", previousStroke, previousPriority);
          else decoy.style.removeProperty("stroke");
        };
      });
      const degeneratePath = temporarily(() => {
        const previous = route.getAttribute("d");
        route.setAttribute("d", "M0 0");
        return () =>
          previous === null
            ? route.removeAttribute("d")
            : route.setAttribute("d", previous);
      });
      const repeatedOldComparatorNegative = !harness.inspectEdge("e:xz:a", true)
        .hasDomGlyph;
      const guardedAfterNegativeControls = inspect();
      return {
        originalCodePoints,
        originalExactRed,
        oldComparatorNegative,
        matcher,
        paintColors,
        positive,
        wrongLabel,
        doubledSpace,
        narrowNoBreak,
        zeroWidthSpace,
        bidiChanged,
        duplicate,
        foreignOwner,
        nestedOwner,
        hiddenChild,
        zeroFontChild,
        transparentChild,
        zeroWidth,
        zeroHeight,
        transparentPath,
        zeroRouteStrokeWidth,
        zeroRouteStrokeOpacity,
        hiddenRouteWithPaintedDecoy,
        degeneratePath,
        repeatedOldComparatorNegative,
        guardedAfterNegativeControls,
      };
    });
    expect(ca066.originalCodePoints).toEqual([
      112, 97, 114, 97, 108, 108, 101, 108, 160, 65,
    ]);
    expect(
      ca066.originalExactRed,
      "old exact comparator must reject observed U+00A0",
    ).toBe(true);
    expect(
      ca066.oldComparatorNegative,
      "old exact-comparator diagnostic must reject candidate NBSP",
    ).toBe(true);
    expect(ca066.matcher).toEqual({
      plain: true,
      candidateNbsp: true,
      modelNbspReverse: false,
    });
    expect(ca066.paintColors).toEqual({
      opaqueBlackRgb: true,
      opaqueRedRgb: true,
      rgbaZeroAlpha: false,
      rgbSlashZeroAlpha: false,
      none: false,
      transparent: false,
      unresolvedPaintServer: false,
    });
    expect(ca066.positive, "guarded same-edge NBSP candidate").toBe(true);
    expect(
      ca066.repeatedOldComparatorNegative,
      "repeated old-comparator diagnostic remains negative",
    ).toBe(true);
    expect(
      ca066.guardedAfterNegativeControls,
      "guarded inspector remains eligible after reversible negative controls",
    ).toBe(true);
    for (const [name, eligible] of Object.entries(ca066)) {
      if (
        name === "originalCodePoints" ||
        name === "originalExactRed" ||
        name === "matcher" ||
        name === "paintColors" ||
        name === "positive" ||
        name === "oldComparatorNegative" ||
        name === "repeatedOldComparatorNegative" ||
        name === "guardedAfterNegativeControls"
      )
        continue;
      expect(eligible, `CA066 negative ${name} must remain RED`).toBe(false);
    }
    const recorder = await page.evaluate(
      () =>
        new Promise<{
          events: CspEvent[];
          styles: StyleInsertion[];
          overflow: boolean;
        }>((resolve) =>
          requestAnimationFrame(() =>
            requestAnimationFrame(() =>
              setTimeout(
                () =>
                  resolve({
                    events: (window as any).__ca059Csp,
                    styles: (window as any).__ca059Styles,
                    overflow: (window as any).__ca059RecorderOverflow,
                  }),
                0,
              ),
            ),
          ),
        ),
    );
    const csp = classifyCsp(recorder.events, recorder.styles);
    observed = { ...probe, negative, csp };
    expect(
      recorder.overflow,
      "CA059_UNRESOLVED_LIMIT: CSP/style source recorder exceeded bounded capture",
    ).toBe(false);
    expect(
      csp.unexpected,
      "CA059_UNKNOWN_CSP_SOURCE: any non-X6-core style or new script/style violation",
    ).toEqual([]);
    expect(probe.scene, "real Worker/ELK scene, not preparation-only").toEqual({
      width: 1128,
      height: 296,
    });
    expect(probe.aliasCalls.slice().sort()).toEqual(
      LABELS.map(([, label]) => label).sort(),
    );
    expect(probe.edges.map((edge: { id: string }) => edge.id).sort()).toEqual(
      LABELS.map(([id]) => id).sort(),
    );
    expect(
      probe.edges.every(
        (edge: { hasDomGlyph: boolean; hasSvgPath: boolean }) =>
          edge.hasDomGlyph && edge.hasSvgPath,
      ),
      "actual real X6 SVG paths and DOM glyphs",
    ).toBe(true);
    expect(probe.domCells).toBeGreaterThanOrEqual(5);
    await page.evaluate(() => (window as any).__ca059Harness.dispose());
    status = "HARNESS_ONLY_NO_SEMANTIC_PROOF";
  } catch (error) {
    reason = String(error instanceof Error ? error.message : error).slice(
      0,
      240,
    );
    status = reason.includes("CA059_UNRESOLVED_LIMIT")
      ? "UNRESOLVED_LIMIT"
      : "UNRESOLVED_HARNESS";
    throw error; // fail closed: no fixture-only or manual-Graph fallback
  } finally {
    try {
      const body = boundedJson({
        status,
        reason,
        observed,
        elapsedMs: Date.now() - started,
        untested: [
          "six-pixel clearance",
          "tab-hover-focus-ARIA",
          "foreign stroke/arrow",
          "nine-label transactional rollback",
          "10k Worker/ELK/X6",
          "screenshot readability",
          "unchanged original e:yw strict preflight RED, separately verified",
        ],
        ca060: "SEPARATE_RED_NOT_SECURITY_ACCEPTANCE",
      });
      await testInfo.attach("ca059-ci1-harness-only", {
        body,
        contentType: "application/json",
      });
      if (JSON.parse(body).status === "UNRESOLVED_LIMIT") {
        status = "UNRESOLVED_LIMIT";
        throw new Error(
          "CA059_UNRESOLVED_LIMIT: evidence over 16KiB UTF8; smoke invalid",
        );
      }
    } catch (error) {
      if (status !== "UNRESOLVED_LIMIT") status = "UNRESOLVED_HARNESS";
      throw error;
    } finally {
      try {
        await context.close();
      } catch (error) {
        status = "UNRESOLVED_HARNESS";
        throw error;
      }
    }
  }
});
