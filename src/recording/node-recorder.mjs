/**
 * Opt-in Node.js runtime recorder. The inspected program runs in its own child
 * process; this file belongs to the installed MCP package, not the workspace.
 * Only debugger-observed locations and values become `observed` trace events.
 */
import { spawn } from 'node:child_process';
import { readFile, realpath, stat } from 'node:fs/promises';
import { SourceMap } from 'node:module';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'acorn';
import { createInspectorStderrHandler } from './inspector-stderr.mjs';

const [rootArg, entry, eventLimitArg, byteLimitArg, ...arguments_] =
  process.argv.slice(2);
const root = await realpath(rootArg);
const eventLimit = Number(eventLimitArg);
const byteLimit = Number(byteLimitArg);
const protocol = process.stdout;
const scripts = new Map();
const sources = new Set();
const stack = [];
const suspendedCalls = new Map();
const resumeBreakpoints = new Set();
const entryBreakpoints = new Map();
const entryBreakpointLocations = new Set();
const invocationContextKey = `code-anime-invocations-${process.pid}`;
const requests = new Map();
let socket;
let nextId = 0;
let nextCall = 0;
let eventCount = 0;
let written = 0;
let sourceBytes = 0;
let lastFrame;
let stopped = false;
let stopReason = '';
let stderrBuffer = '';
let applicationStderrTail = '';
let inspected = false;
let previousPause;
let repeatedPause = 0;
let pausedInFlight = 0;
let closeRequested = false;
let resolveDebuggerShutdown;
const debuggerShutdown = new Promise((resolve) => {
  resolveDebuggerShutdown = resolve;
});

const coverage =
  'Node.js JavaScript execution observed via V8 Inspector, in one process for this input. ' +
  'Source-line snapshots precede execution; parameters, block locals and own data properties ' +
  'are bounded. Sparse array holes and non-index properties remain distinct; V8 object types ' +
  'are retained, but native internal state is not inspected. Calls are identified from ' +
  'debugger-visible JavaScript frames. ' +
  'Exceptions thrown in active user source frames are recorded when V8 reports their values. ' +
  'Returns are reported only when V8 exposes a return value. Promise snapshots ' +
  'include debugger-observed state/results when available; later settlement is not tracked. ' +
  'Other frame exits remain unresolved, without invented causes. ' +
  'UTF-8 stdout/stderr text is captured at pipe delivery, without assigning an unverified ' +
  'source location or invocation; cross-stream write ordering is not established. ' +
  'Original source positions are used only when a local source map and its ' +
  'embedded source content match the project files; unmapped generated locations are omitted. ' +
  'Native frames, worker threads, child processes, timers after process exit, ' +
  'getters, Proxies, and framework internals are outside the recorded scope.';

function send(message, budget = true) {
  const line = JSON.stringify(message) + '\n';
  const size = Buffer.byteLength(line);
  if (budget && written + size > byteLimit)
    throw new Error('Configured trace byte budget reached');
  written += size;
  protocol.write(line);
}

function emit(event) {
  if (eventCount >= eventLimit)
    throw new Error('Configured event budget reached');
  send({ type: 'event', event: { id: `event-${eventCount + 1}`, ...event } });
  eventCount++;
}

function stop(reason) {
  if (stopped) return;
  stopped = true;
  stopReason = reason;
  try {
    socket?.close();
  } catch {
    /* Inspector already closed. */
  }
  if (process.platform === 'win32' && child.pid) {
    // On Windows, taskkill removes descendants spawned by the inspected program.
    const killer = spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    });
    killer.once('error', () => child.kill());
    killer.once('exit', (code) => {
      if (code !== 0) child.kill();
    });
  } else child.kill('SIGKILL');
}

function request(method, params = {}) {
  if (socket?.readyState !== WebSocket.OPEN)
    return Promise.reject(new Error('Debugger disconnected'));
  const id = ++nextId;
  return new Promise((resolve, reject) => {
    requests.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

function closeDebuggerWhenIdle() {
  // Node may announce shutdown while the response to the final step request
  // is still in flight. Signal that the program has finished first, allowing
  // an unanswered step request to stop waiting before the socket is closed.
  // Paused-frame inspections still finish before closing the debugger.
  closeRequested = true;
  resolveDebuggerShutdown();
  if (pausedInFlight === 0) socket?.close();
}

function projectPath(filename) {
  const path = relative(root, filename);
  if (
    path === '..' ||
    path.startsWith('..' + sep) ||
    isAbsolute(path) ||
    path
      .split(sep)
      .some((part) => ['node_modules', '.git', '.venv'].includes(part))
  )
    return undefined;
  return path.split(sep).join('/');
}

function functionEntries(source) {
  let ast;
  // V8 can execute CommonJS scripts containing constructs (for example,
  // `with`) that Acorn rejects in strict ES modules. Preserve the module
  // parse for ESM and retry script grammar for executable CommonJS syntax.
  // These ASTs only select debugger breakpoints; V8 remains authoritative
  // about what executed and which values were observed.
  for (const sourceType of ['module', 'script']) {
    try {
      ast = parse(source, {
        ecmaVersion: 'latest',
        sourceType,
        locations: true,
        allowHashBang: true,
        allowReturnOutsideFunction: true,
      });
      break;
    } catch {
      // Try the other JavaScript grammar before giving up on breakpoint hints.
    }
  }
  if (!ast) {
    // The V8 debugger remains authoritative for syntax Acorn cannot parse.
    return { entries: [], awaitSites: new Map(), functionRanges: [] };
  }
  const pending = [{ node: ast, scope: null, statement: null }];
  const entries = new Map();
  const awaitSites = new Map();
  const functionRanges = [];
  while (pending.length) {
    const {
      node,
      scope: parentScope,
      statement: parentStatement,
    } = pending.pop();
    const isFunction =
      node.type === 'FunctionDeclaration' ||
      node.type === 'FunctionExpression' ||
      node.type === 'ArrowFunctionExpression';
    // Two different functions can share a line. Associate each await with its
    // nearest lexical function, so a sibling throw cannot look like a suspend.
    const scope = isFunction ? `${node.start}:${node.end}` : parentScope;
    const statement = isFunction
      ? null
      : node.type.endsWith('Statement') && node.type !== 'BlockStatement'
        ? node
        : node.type === 'VariableDeclaration'
          ? node
          : parentStatement;
    if (isFunction) {
      functionRanges.push({
        scope,
        start: node.loc.start,
        end: node.loc.end,
        size: node.end - node.start,
      });
    }
    // A keyword-looking string, property name, or comment is not an async
    // suspension point. Include both await expressions and for-await loops,
    // which Acorn represents as ForOfStatements with await: true.
    if (
      node.loc &&
      (node.type === 'AwaitExpression' ||
        (node.type === 'ForOfStatement' && node.await === true))
    ) {
      const line = node.loc.start.line;
      if (!awaitSites.has(line)) awaitSites.set(line, []);
      awaitSites.get(line).push({
        scope,
        start: statement?.loc?.start || node.loc.start,
        end: statement?.loc?.end || node.loc.end,
      });
    }
    if (isFunction) {
      const body = node.body;
      const first =
        body.type === 'BlockStatement'
          ? body.body.find((statement) => statement.type !== 'EmptyStatement')
          : body;
      if (first?.loc) {
        const { line, column } = first.loc.start;
        entries.set(`${line}:${column}`, {
          lineNumber: line - 1,
          columnNumber: column,
        });
      }
    }
    for (const value of Object.values(node)) {
      const candidates = Array.isArray(value) ? value : [value];
      for (const child of candidates) {
        if (
          child &&
          typeof child === 'object' &&
          typeof child.type === 'string'
        )
          pending.push({ node: child, scope, statement });
      }
    }
  }
  return { entries: [...entries.values()], awaitSites, functionRanges };
}

function rememberEntryBreakpoint(scriptId, location, breakpointId) {
  const key = `${scriptId}:${location.lineNumber}`;
  if (!entryBreakpoints.has(key)) entryBreakpoints.set(key, new Set());
  entryBreakpoints.get(key).add(breakpointId);
}

async function prepareFunctionEntries(scriptId, source) {
  // Async suspension can cause V8 to step past sibling user calls in the
  // synchronous caller. Preinstall debugger breakpoints at real function-body
  // statements, so later invocations are observed even after an await.
  const { entries, awaitSites, functionRanges } = functionEntries(source);
  scripts.get(scriptId).awaitSites = awaitSites;
  scripts.get(scriptId).functionRanges = functionRanges;
  for (const location of entries) {
    const key = `${scriptId}:${location.lineNumber}:${location.columnNumber}`;
    if (entryBreakpointLocations.has(key)) continue;
    entryBreakpointLocations.add(key);
    try {
      const { breakpointId, actualLocation } = await request(
        'Debugger.setBreakpoint',
        { location: { scriptId, ...location } },
      );
      if (breakpointId)
        rememberEntryBreakpoint(
          scriptId,
          actualLocation || location,
          breakpointId,
        );
    } catch (error) {
      // V8 can resolve multiple functions to the same breakpoint position.
      // The existing breakpoint still observes those pauses.
      if (
        !String(error.message).includes(
          'Breakpoint at specified location already exists.',
        )
      )
        throw error;
    }
  }
}

async function snapshotSource(file, content) {
  if (sources.has(file)) return;
  sourceBytes += Buffer.byteLength(content);
  if (sourceBytes > 2 * 1024 * 1024)
    throw new Error('Source snapshots exceed 2 MiB budget');
  send({ type: 'source', file, content });
  sources.add(file);
}

async function verifiedSourceMap(filename, compiled) {
  // Only consume a locally referenced map; remote URLs and untrusted sources
  // must not redirect the displayed code away from the inspected project.
  const matches = [
    ...compiled.matchAll(/^\s*\/\/[#@]\s*sourceMappingURL\s*=\s*(\S+)\s*$/gm),
  ];
  const reference = matches.at(-1)?.[1];
  if (!reference) return undefined;
  let mapFile = filename;
  let payload;
  try {
    if (/^data:application\/json(?:;charset=utf-8)?;base64,/i.test(reference)) {
      const encoded = reference.slice(reference.indexOf(',') + 1);
      if (encoded.length > 700000) return undefined;
      payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
    } else {
      if (!/^[\w./\\%-]+\.map$/.test(reference)) return undefined;
      mapFile = await realpath(
        resolve(dirname(filename), decodeURIComponent(reference)),
      );
      if (!projectPath(mapFile)) return undefined;
      const info = await stat(mapFile);
      if (!info.isFile() || info.size > 512 * 1024) return undefined;
      payload = JSON.parse(await readFile(mapFile, 'utf8'));
    }
    if (
      payload?.version !== 3 ||
      !Array.isArray(payload.sources) ||
      !Array.isArray(payload.sourcesContent) ||
      payload.sources.length > 100 ||
      (typeof payload.sourceRoot !== 'undefined' &&
        typeof payload.sourceRoot !== 'string')
    )
      return undefined;
    const targets = new Map();
    for (let i = 0; i < payload.sources.length; i++) {
      const source = payload.sources[i];
      const expected = payload.sourcesContent[i];
      if (typeof source !== 'string' || typeof expected !== 'string') continue;
      if (Buffer.byteLength(expected) > 512 * 1024) continue;
      const path = resolve(dirname(mapFile), payload.sourceRoot || '', source);
      const actual = await realpath(path).catch(() => undefined);
      if (!actual) continue;
      const file = projectPath(actual);
      if (!file || file.split('/').includes('dist')) continue;
      const info = await stat(actual);
      if (!info.isFile() || info.size > 512 * 1024) continue;
      // An old map or a changed source file can point the player at a line
      // unrelated to the JavaScript that V8 actually executed.
      if ((await readFile(actual, 'utf8')) !== expected) continue;
      targets.set(source, {
        file,
        content: expected,
        lines: expected.split(/\r?\n/),
      });
    }
    if (!targets.size) return undefined;
    return { map: new SourceMap(payload), targets };
  } catch {
    return undefined;
  }
}

async function projectSource(scriptId, location) {
  const script = scripts.get(scriptId);
  if (!script?.url.startsWith('file://')) return undefined;
  if (!script.checked) {
    script.checked = true;
    const filename = await realpath(fileURLToPath(script.url)).catch(
      () => undefined,
    );
    if (!filename) return undefined;
    const file = projectPath(filename);
    if (!file) return undefined;
    const info = await stat(filename);
    if (!info.isFile() || info.size > 512 * 1024)
      throw new Error('Source exceeds 512 KiB budget: ' + file);
    const { scriptSource } = await request('Debugger.getScriptSource', {
      scriptId,
    });
    script.file = file;
    script.source = scriptSource;
    script.sourceLines = scriptSource.split(/\r?\n/);
    if (!file.split('/').includes('dist'))
      await prepareFunctionEntries(scriptId, scriptSource);
    script.sourceMap = await verifiedSourceMap(filename, scriptSource);
  }
  if (!script.file) return undefined;
  if (script.sourceMap) {
    const mapping = script.sourceMap.map.findEntry(
      location.lineNumber,
      location.columnNumber,
    );
    const target = script.sourceMap.targets.get(mapping?.originalSource);
    if (
      target &&
      mapping.generatedLine === location.lineNumber &&
      Number.isInteger(mapping.originalLine) &&
      mapping.originalLine >= 0 &&
      mapping.originalLine < target.lines.length
    ) {
      await snapshotSource(target.file, target.content);
      return {
        file: target.file,
        line: mapping.originalLine + 1,
        generated: { file: script.file, line: location.lineNumber + 1 },
      };
    }
  }
  // Generated build output is displayed only with a verified original mapping.
  // Other local JavaScript still uses the exact compiled text returned by V8.
  if (script.file.split('/').includes('dist')) return undefined;
  await snapshotSource(script.file, script.source);
  return { file: script.file, line: location.lineNumber + 1 };
}

function sourceLocation(frame) {
  return {
    file: frame.file,
    line: frame.line,
    endLine: frame.line,
    ...(frame.generated ? { generated: frame.generated } : {}),
  };
}

async function remoteValue(object, depth = 0, seen = new Set()) {
  if (!object || object.type === 'undefined') return { $type: 'undefined' };
  if ('value' in object) return object.value;
  if (object.unserializableValue)
    return { $type: object.type, $value: object.unserializableValue };
  if (!object.objectId)
    return { $type: object.type, $unavailable: 'Debugger value unavailable' };
  if (object.type === 'function')
    return { $type: 'function', $unavailable: 'Function internals omitted' };
  if (object.subtype === 'promise' || object.className === 'Promise') {
    // V8 exposes Promise state through internalProperties without evaluating
    // user code. This is only the state at inspection time: a pending Promise
    // must never be presented as a later fulfilled/rejected result.
    try {
      const { internalProperties = [] } = await request(
        'Runtime.getProperties',
        { objectId: object.objectId, ownProperties: true },
      );
      const state = internalProperties.find(
        (property) => property.name === '[[PromiseState]]',
      )?.value?.value;
      const settled = internalProperties.find(
        (property) => property.name === '[[PromiseResult]]',
      )?.value;
      if (['fulfilled', 'rejected'].includes(state))
        return {
          $type: 'Promise',
          $state: state,
          ...(settled
            ? { $result: await remoteValue(settled, depth + 1, seen) }
            : {}),
          ...(!settled
            ? { $unavailable: 'Promise result not exposed by V8' }
            : {}),
        };
      if (state === 'pending')
        return {
          $type: 'Promise',
          $state: 'pending',
          $unavailable: 'Settlement after this snapshot was not observed',
        };
    } catch {
      // V8 can revoke inspection handles during shutdown or reject access.
      // Preserve the Promise identity without inventing its settlement.
    }
    return {
      $type: 'Promise',
      $unavailable: 'Promise settlement not observed',
    };
  }
  if (object.subtype === 'proxy')
    return { $type: 'Proxy', $unavailable: 'Proxy traps not evaluated' };
  if (depth >= 3 || seen.has(object.objectId))
    return {
      $type: object.className || object.type,
      $unavailable: 'Depth or reference budget',
    };
  const visited = new Set(seen).add(object.objectId);
  let properties;
  try {
    ({ result: properties } = await request('Runtime.getProperties', {
      objectId: object.objectId,
      ownProperties: true,
      generatePreview: false,
    }));
  } catch {
    return {
      $type: object.className || object.type,
      $unavailable: 'Properties unavailable',
    };
  }
  const entries = properties.filter((property) => property.enumerable);
  const limited = entries.slice(0, 40);
  if (object.subtype === 'array') {
    const length = properties.find((property) => property.name === 'length')
      ?.value?.value;
    const isElement = (name) =>
      /^(0|[1-9]\d*)$/.test(name) &&
      Number.isSafeInteger(length) &&
      Number(name) < length;
    const dense =
      Number.isSafeInteger(length) &&
      length <= 40 &&
      entries.length === length &&
      entries.every((item) => isElement(item.name));
    if (dense) {
      const result = Array(length);
      const values = await Promise.all(
        entries.map((item) =>
          item.value
            ? remoteValue(item.value, depth + 1, visited)
            : { $unavailable: 'Accessor not evaluated' },
        ),
      );
      for (let index = 0; index < entries.length; index++)
        result[Number(entries[index].name)] = values[index];
      return result;
    }
    // JSON turns array holes into null and drops trailing holes. Preserve the
    // observed length and exact own keys instead of manufacturing values.
    const elements = {};
    const namedProperties = {};
    const values = await Promise.all(
      limited.map((item) =>
        item.value
          ? remoteValue(item.value, depth + 1, visited)
          : { $unavailable: 'Accessor not evaluated' },
      ),
    );
    for (let index = 0; index < limited.length; index++) {
      const item = limited[index];
      Object.defineProperty(
        isElement(item.name) ? elements : namedProperties,
        item.name,
        {
          value: values[index],
          enumerable: true,
        },
      );
    }
    return {
      $type: 'Array',
      length: Number.isSafeInteger(length)
        ? length
        : { $unavailable: 'Unknown length' },
      elements,
      ...(Object.keys(namedProperties).length
        ? { properties: namedProperties }
        : {}),
      ...(entries.length > 40
        ? {
            $unavailable: `${entries.length - 40} additional properties omitted`,
          }
        : {}),
    };
  }
  const result = {};
  const values = await Promise.all(
    limited.map((item) =>
      item.value
        ? remoteValue(item.value, depth + 1, visited)
        : { $unavailable: 'Accessor not evaluated' },
    ),
  );
  for (let index = 0; index < limited.length; index++) {
    const item = limited[index];
    Object.defineProperty(result, item.name, {
      value: values[index],
      enumerable: true,
      configurable: true,
    });
  }
  if (entries.length > 40)
    result.$unavailable = `${entries.length - 40} additional properties omitted`;
  // Native containers (Map, Set, Date, RegExp, typed arrays, Errors) can have
  // no enumerable own keys despite holding significant internal state. Class
  // instances also lose their identity when flattened to plain JSON objects.
  // Preserve V8's observed type and visible own properties, and explicitly
  // mark the uninspected internals instead of reporting a misleading `{}`.
  if (
    object.type === 'object' &&
    object.className &&
    object.className !== 'Object'
  )
    return {
      $type: object.className,
      ...(typeof object.description === 'string'
        ? { $description: object.description.slice(0, 256) }
        : {}),
      properties: result,
      $unavailable:
        'Prototype, non-enumerable properties and internal state not inspected',
    };
  return result;
}

async function locals(frame) {
  const values = {};
  let seen = 0;
  // All property reads observe the same debugger pause. Fetch the independent
  // scopes together, then apply lexical shadowing in their original order.
  const scopes = frame.scopeChain.filter((scope) =>
    ['local', 'block', 'catch', 'script', 'module'].includes(scope.type),
  );
  const scopeProperties = await Promise.all(
    scopes.map((scope) =>
      request('Runtime.getProperties', {
        objectId: scope.object.objectId,
        ownProperties: true,
      }),
    ),
  );
  const selected = [];
  const names = new Set();
  for (const properties of scopeProperties) {
    for (const property of properties.result) {
      if (
        !property.enumerable ||
        property.name.startsWith('__') ||
        ['module', 'exports', 'require'].includes(property.name)
      )
        continue;
      if (seen++ >= 40) {
        values.$unavailable = 'Locals exceed 40 entries';
        break;
      }
      if (names.has(property.name)) continue;
      names.add(property.name);
      selected.push(property);
    }
    if (seen > 40) break;
  }
  const snapshots = await Promise.all(
    selected.map((property) =>
      property.value
        ? remoteValue(property.value)
        : { $unavailable: 'Accessor not evaluated' },
    ),
  );
  for (let index = 0; index < selected.length; index++)
    Object.defineProperty(values, selected[index].name, {
      value: snapshots[index],
      enumerable: true,
      configurable: true,
    });
  return values;
}

async function invocationContext(frame, activeFrames) {
  const expression =
    `globalThis[Symbol.for(${JSON.stringify(invocationContextKey)})]` +
    (activeFrames
      ? `.enterWith(${JSON.stringify(activeFrames.map(({ signature, callId }) => ({ signature, callId })))})`
      : '.getStore()');
  const reply = await request('Debugger.evaluateOnCallFrame', {
    callFrameId: frame.callFrameId,
    expression,
    returnByValue: true,
  });
  if (reply.exceptionDetails)
    throw new Error('Unable to inspect async invocation context');
  return reply.result?.value;
}

async function breakpointAfterAwait(frame) {
  const script = scripts.get(frame.raw.location.scriptId);
  const lines = script?.sourceLines;
  const candidates = script?.awaitSites?.get(frame.generatedLine);
  if (!lines || !candidates) return false;
  const { lineNumber, columnNumber } = frame.raw.location;
  const positionInRange = ({ line, column }, start, end) =>
    (line > start.line || (line === start.line && column >= start.column)) &&
    (line < end.line || (line === end.line && column < end.column));
  let currentScope = null;
  let narrowest = Infinity;
  for (const { scope, start, end, size } of script.functionRanges) {
    if (
      size < narrowest &&
      positionInRange(
        { line: lineNumber + 1, column: columnNumber },
        start,
        end,
      )
    ) {
      narrowest = size;
      currentScope = scope;
    }
  }
  if (
    !candidates.some(
      ({ scope, start, end }) =>
        scope === currentScope &&
        positionInRange(
          { line: lineNumber + 1, column: columnNumber },
          start,
          end,
        ),
    )
  )
    return false;
  const next = lines.findIndex(
    (line, index) =>
      index >= frame.generatedLine &&
      line.trim() &&
      !line.trim().startsWith('//'),
  );
  if (next < 0) return false;
  const key = `${frame.raw.location.scriptId}:${next}`;
  if (!resumeBreakpoints.has(key)) {
    try {
      await request('Debugger.setBreakpoint', {
        location: { scriptId: frame.raw.location.scriptId, lineNumber: next },
      });
    } catch (error) {
      if (
        !String(error.message).includes(
          'Breakpoint at specified location already exists.',
        )
      )
        throw error;
    }
    resumeBreakpoints.add(key);
  }
  return true;
}

async function breakpointAtEntry(frame) {
  const key = `${frame.raw.location.scriptId}:${frame.generatedLine - 1}`;
  if (entryBreakpoints.has(key)) return;
  try {
    const { breakpointId, actualLocation } = await request(
      'Debugger.setBreakpoint',
      {
        location: {
          scriptId: frame.raw.location.scriptId,
          lineNumber: frame.generatedLine - 1,
        },
      },
    );
    rememberEntryBreakpoint(
      frame.raw.location.scriptId,
      actualLocation || { lineNumber: frame.generatedLine - 1 },
      breakpointId,
    );
  } catch (error) {
    if (
      !String(error.message).includes(
        'Breakpoint at specified location already exists.',
      )
    )
      throw error;
  }
}

async function paused(params) {
  const frames = [];
  for (const frame of [...params.callFrames].reverse()) {
    const source = await projectSource(frame.location.scriptId, frame.location);
    if (!source) continue;
    const symbol = frame.functionName || '<module>';
    frames.push({
      raw: frame,
      ...source,
      generatedLine: frame.location.lineNumber + 1,
      generatedColumn: frame.location.columnNumber,
      symbol,
      signature: `${frame.location.scriptId}:${frame.functionLocation?.lineNumber ?? 0}:${symbol}`,
      symbolId: `${source.file}:${symbol}`,
    });
  }
  const resumedContext = frames.at(-1)
    ? await invocationContext(frames.at(-1).raw)
    : undefined;
  let common = 0;
  while (
    common < frames.length &&
    common < stack.length &&
    stack[common].signature === frames[common].signature &&
    // V8 can step straight from one synchronous callback's observed return
    // into its next invocation without exposing an intervening caller frame.
    // A new hit on its function-entry breakpoint establishes a new invocation;
    // simply revisiting a loop line (without a return) does not.
    !(
      (stack[common].awaiting ||
        Object.hasOwn(stack[common], 'observedReturn')) &&
      [
        ...(entryBreakpoints.get(
          `${frames[common].raw.location.scriptId}:${frames[common].generatedLine - 1}`,
        ) || []),
      ].some((breakpointId) => params.hitBreakpoints?.includes(breakpointId))
    ) &&
    !(
      common === frames.length - 1 &&
      resumedContext?.some(
        ({ signature, callId }) =>
          signature === frames[common].signature &&
          suspendedCalls.has(callId) &&
          stack[common].callId !== callId,
      )
    )
  )
    common++;
  for (let index = stack.length - 1; index >= common; index--) {
    const old = stack[index];
    stack.pop();
    // A syntactic await on the last paused line is only a candidate for
    // suspension. V8's debugger-reported return is stronger evidence that
    // this invocation completed, including `return await ...` expressions.
    const observedReturn = Object.hasOwn(old, 'observedReturn');
    if (old.awaiting && !observedReturn) {
      suspendedCalls.set(old.callId, old);
      emit({
        kind: 'await',
        symbolId: old.symbolId,
        callId: old.callId,
        ...(stack.at(-1) ? { parentCallId: stack.at(-1).callId } : {}),
        label: `await in ${old.symbol}`,
        source: sourceLocation(old),
        values: { task: old.callId, thread: 'main' },
        stack: [...stack.map((frame) => frame.callId), old.callId],
        certainty: 'observed',
        note: 'Paused on await before the frame left the synchronous debugger stack',
      });
      continue;
    }
    emit({
      kind: observedReturn ? 'return' : 'unresolved',
      symbolId: old.symbolId,
      callId: old.callId,
      ...(stack.at(-1) ? { parentCallId: stack.at(-1).callId } : {}),
      label: `${observedReturn ? 'return' : 'exited'} ${old.symbol}`,
      source: sourceLocation(old),
      values: { task: 'main', thread: 'main' },
      stack: stack.map((frame) => frame.callId),
      ...(observedReturn ? { result: old.observedReturn } : {}),
      note: observedReturn
        ? 'Return value reported by V8 at the function return position'
        : 'Frame disappeared; debugger did not establish the return value or exception cause',
      certainty: 'observed',
    });
  }
  const snapshots = {};
  // Every debugger frame is frozen at this pause. Start independent local
  // inspections together; retain the original outer-to-inner event order.
  const frameSnapshots = frames.map((frame) => locals(frame.raw));
  await Promise.all(frameSnapshots);
  for (let index = 0; index < frames.length; index++) {
    const current = frames[index];
    if (index >= common) {
      // The async context contains the invocation ancestry captured by V8.
      // A nested awaited call can replace the current store, so its scalar
      // identity alone cannot identify the parent that will resume afterward.
      const suspension = [...(resumedContext || [])]
        .reverse()
        .filter(({ signature }) => signature === current.signature)
        .map(({ callId }) => suspendedCalls.get(callId))
        .find(Boolean);
      const resuming =
        index === frames.length - 1 &&
        suspension?.signature === current.signature &&
        // An await can continue later on its original line. Only recognize
        // this as progress when V8 moves beyond the suspended source column;
        // re-pausing at the await itself does not establish a resumption.
        (current.generatedLine > suspension.generatedLine ||
          (current.generatedLine === suspension.generatedLine &&
            current.generatedColumn > suspension.generatedColumn));
      current.resuming = resuming;
      current.callId = resuming ? suspension.callId : `call-${++nextCall}`;
      stack.push(current);
      if (resuming) {
        suspendedCalls.delete(current.callId);
        emit({
          kind: 'resume',
          symbolId: current.symbolId,
          callId: current.callId,
          label: `resume ${current.symbol}`,
          source: sourceLocation(current),
          values: { task: current.callId, thread: 'main' },
          stack: stack.map((frame) => frame.callId),
          certainty: 'observed',
          note: 'Resumed in the async context bound to the original invocation',
        });
      } else {
        await invocationContext(current.raw, stack);
        await breakpointAtEntry(current);
      }
    } else {
      current.callId = stack[index].callId;
      stack[index].line = current.line;
      stack[index].generatedLine = current.generatedLine;
      stack[index].generatedColumn = current.generatedColumn;
      stack[index].generated = current.generated;
      stack[index].file = current.file;
      stack[index].symbolId = current.symbolId;
    }
    snapshots[current.callId] = await frameSnapshots[index];
    // V8 exposes `returnValue` only at a debugger-observed return position.
    // Do not evaluate the source expression or derive a return from locals.
    if (Object.hasOwn(current.raw, 'returnValue')) {
      stack[index].observedReturn = await remoteValue(current.raw.returnValue);
    }
    if (index >= common && !current.resuming) {
      emit({
        kind: 'enter',
        symbolId: current.symbolId,
        callId: current.callId,
        ...(index ? { parentCallId: frames[index - 1].callId } : {}),
        label: `enter ${current.symbol}`,
        source: sourceLocation(current),
        inputs: snapshots[current.callId],
        values: { task: 'main', thread: 'main', phase: 'before' },
        stack: stack.slice(0, index + 1).map((frame) => frame.callId),
        locals: { ...snapshots },
        certainty: 'observed',
      });
    }
  }
  const active = frames.at(-1);
  if (!active) {
    // The debugger is now inside a blackboxed runtime frame. Reset the last
    // user frame so the next command resumes to a real project breakpoint,
    // instead of repeatedly stepping through Node's idle/shutdown machinery.
    // Preinstalled function-entry breakpoints still observe later callbacks.
    lastFrame = undefined;
    previousPause = undefined;
    repeatedPause = 0;
    return;
  }
  // Inspector may stop multiple times inside one source statement. Compare
  // column and captured state as well as the line: a loop can execute the
  // same line repeatedly with different values and must remain visible.
  const pauseFingerprint = JSON.stringify({
    callId: active.callId,
    file: active.file,
    line: active.line,
    column: active.raw.location.columnNumber,
    locals: snapshots,
  });
  repeatedPause = pauseFingerprint === previousPause ? repeatedPause + 1 : 0;
  previousPause = pauseFingerprint;
  lastFrame = {
    ...active,
    callId: active.callId,
    stack: frames.map((frame) => frame.callId),
    locals: snapshots,
  };
  active.awaiting = await breakpointAfterAwait(active);
  stack.at(-1).awaiting = active.awaiting;
  const activeScope = stack.at(-1);
  // Multiple lexical catch scopes may be active simultaneously. A boolean
  // misses the inner handler when execution enters it from an outer handler.
  // Scope source ranges identify handlers across successive debugger pauses;
  // the debugger's transient scope objectId is not a stable identity.
  const previousCatchScopes = activeScope.catchScopes || new Set();
  const currentCatchScopes = new Set();
  for (const scope of active.raw.scopeChain) {
    if (scope.type !== 'catch') continue;
    const start = scope.startLocation;
    const end = scope.endLocation;
    const key = start
      ? `${start.scriptId}:${start.lineNumber}:${start.columnNumber}:${end?.lineNumber}:${end?.columnNumber}`
      : scope.object.objectId;
    currentCatchScopes.add(key);
    if (previousCatchScopes.has(key)) continue;
    // V8 exposes the scope while the handler is active. Do not infer where
    // the exception originated or pretend the current line is a catch clause.
    emit({
      kind: 'catch',
      symbolId: active.symbolId,
      callId: active.callId,
      ...(frames.length > 1 ? { parentCallId: frames.at(-2).callId } : {}),
      label: `catch in ${active.symbol}`,
      source: sourceLocation(active),
      values: { task: 'main', thread: 'main' },
      inputs: snapshots[active.callId],
      stack: lastFrame.stack,
      locals: snapshots,
      certainty: 'observed',
      note: 'Entered a catch scope observed by V8',
    });
  }
  activeScope.catchScopes = currentCatchScopes;
  // Stepping into blackboxed Node internals may pause many times at the same
  // visible user location. Only report each distinct source step once.
  if (repeatedPause === 0)
    emit({
      kind: 'statement',
      symbolId: active.symbolId,
      callId: active.callId,
      ...(frames.length > 1 ? { parentCallId: frames.at(-2).callId } : {}),
      label: `statement ${active.symbol}`,
      source: sourceLocation(active),
      values: { task: 'main', thread: 'main', phase: 'before' },
      stack: lastFrame.stack,
      locals: snapshots,
      note: 'State before this source line executes',
      certainty: 'observed',
    });
  if (
    (params.reason === 'exception' || params.reason === 'promiseRejection') &&
    params.data &&
    active.raw === params.callFrames[0]
  ) {
    // V8 supplies the actual thrown remote object at the pause site. A caller
    // whose callee belongs to a library is not the throw site, even when its
    // frame is the highest project-local frame in the stack.
    const exception = params.data;
    emit({
      kind: 'throw',
      symbolId: active.symbolId,
      callId: active.callId,
      ...(frames.length > 1 ? { parentCallId: frames.at(-2).callId } : {}),
      label: `throw ${exception.className || exception.type || 'exception'}`,
      source: sourceLocation(active),
      values: { task: 'main', thread: 'main' },
      stack: lastFrame.stack,
      locals: snapshots,
      result: {
        type: exception.className || exception.type || 'unknown',
        value: await remoteValue(exception),
        ...(exception.description
          ? { description: exception.description.slice(0, 2048) }
          : {}),
      },
      certainty: 'observed',
      note: 'Exception value reported by V8 at this source location',
    });
  }
}

function output(data, stream) {
  if (stopped || !data) return;
  try {
    // Pipe reads are asynchronous with respect to debugger pauses. The most
    // recently paused frame may already have returned, or another async task
    // may have executed. Preserve the decoded text as observed process output without
    // claiming the last frame wrote them. This also keeps output produced
    // before the first project frame is observed.
    emit({
      kind: 'console',
      symbolId: 'process:output',
      callId: 'process-output',
      label: `process ${stream}`,
      values: {
        task: 'process-output',
        thread: 'unknown',
        stream,
        attribution: 'unresolved',
      },
      stack: [],
      output: data,
      certainty: 'observed',
      note: 'Observed process output text; source invocation and write time are unresolved because pipe delivery may lag execution',
    });
  } catch (error) {
    stop(error.message);
  }
}

const child = spawn(
  process.execPath,
  ['--inspect-brk=127.0.0.1:0', entry, ...arguments_],
  { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] },
);

child.stdout.setEncoding('utf8');
child.stdout.on('data', (data) => output(data, 'stdout'));
child.stderr.setEncoding('utf8');
function applicationStderr(text) {
  // Keep a bounded diagnostic excerpt even when the program fails before V8
  // reaches a project frame (so no console event can yet be associated with it).
  applicationStderrTail = (applicationStderrTail + text).slice(-4096);
  output(text, 'stderr');
}
const stderrLine = createInspectorStderrHandler({
  onListening: (url) => {
    connect(url).catch((error) => stop('Inspector setup: ' + error.message));
  },
  onShutdown: closeDebuggerWhenIdle,
  onOutput: applicationStderr,
});

child.stderr.on('data', (data) => {
  stderrBuffer += data;
  let index;
  while ((index = stderrBuffer.indexOf('\n')) >= 0) {
    stderrLine(stderrBuffer.slice(0, index + 1));
    stderrBuffer = stderrBuffer.slice(index + 1);
  }
  // An application can write indefinitely without newlines. Bound the parser
  // buffer; a long fragment cannot be a standard Inspector notice.
  if (stderrBuffer.length > 8192) {
    applicationStderr(stderrBuffer);
    stderrBuffer = '';
  }
});

async function connect(url) {
  // The Inspector can announce its listening URL before it is able to accept
  // the WebSocket upgrade under heavy startup load. Retry only the initial
  // connection, with a small bounded delay; never replay debugger commands.
  for (let attempt = 0; attempt < 10; attempt++) {
    if (stopped || child.exitCode !== null)
      throw new Error('Inspector connection stopped before attachment');
    const candidate = new WebSocket(url);
    socket = candidate;
    try {
      await new Promise((resolve, reject) => {
        candidate.addEventListener('open', resolve, { once: true });
        candidate.addEventListener(
          'error',
          (event) =>
            reject(
              new Error(
                'WebSocket connection failed' +
                  (event.error?.message ? ': ' + event.error.message : ''),
              ),
            ),
          { once: true },
        );
      });
      if (stopped) {
        try {
          candidate.close();
        } catch {
          /* The connection may already be closing. */
        }
        throw new Error('Inspector connection stopped before attachment');
      }
      break;
    } catch (error) {
      try {
        candidate.close();
      } catch {
        /* A failed handshake may already have closed the socket. */
      }
      if (attempt === 9 || stopped || child.exitCode !== null) throw error;
      await new Promise((resolve) =>
        setTimeout(resolve, Math.min(150 * (attempt + 1), 600)),
      );
    }
  }
  socket.addEventListener('message', (message) => {
    let packet;
    try {
      packet = JSON.parse(message.data);
    } catch {
      return;
    }
    if (packet.id && requests.has(packet.id)) {
      const pending = requests.get(packet.id);
      requests.delete(packet.id);
      if (packet.error) pending.reject(new Error(packet.error.message));
      else pending.resolve(packet.result || {});
    } else if (packet.method === 'Debugger.scriptParsed') {
      scripts.set(packet.params.scriptId, { url: packet.params.url });
    } else if (packet.method === 'Debugger.paused') {
      pausedInFlight++;
      void (async () => {
        try {
          await paused(packet.params);
          if (!stopped && !closeRequested) {
            const step = request(
              !lastFrame || lastFrame.awaiting
                ? 'Debugger.resume'
                : repeatedPause > 0
                  ? 'Debugger.stepOver'
                  : 'Debugger.stepInto',
            );
            // A finished Node process may keep its Inspector connection open
            // until we disconnect while never replying to the final step.
            // Shutdown is authoritative only after Node announces it; a live
            // debugger error must still make the recording incomplete.
            try {
              await Promise.race([step, debuggerShutdown]);
            } catch (error) {
              if (!closeRequested) throw error;
            }
          }
        } catch (error) {
          stop(error.message);
        } finally {
          pausedInFlight--;
          if (closeRequested && pausedInFlight === 0) socket?.close();
        }
      })();
    } else if (
      packet.method === 'Runtime.executionContextDestroyed' &&
      inspected
    ) {
      closeDebuggerWhenIdle();
    }
  });
  socket.addEventListener('close', () => {
    for (const pending of requests.values())
      pending.reject(new Error('Debugger disconnected'));
    requests.clear();
  });
  await request('Runtime.enable');
  await request('Debugger.enable');
  const initialized = await request('Runtime.evaluate', {
    expression: `globalThis[Symbol.for(${JSON.stringify(invocationContextKey)})] = new (process.getBuiltinModule('node:async_hooks').AsyncLocalStorage)()`,
  });
  if (initialized.exceptionDetails)
    throw new Error('Unable to initialize async invocation context');
  await request('Debugger.setBlackboxPatterns', {
    patterns: ['^node:', '/node_modules/', '^internal/'],
  });
  await request('Debugger.setPauseOnExceptions', { state: 'all' });
  inspected = true;
  await request('Runtime.runIfWaitingForDebugger');
}

let exitCode;
try {
  exitCode = await new Promise((resolve, reject) => {
    child.once('close', resolve);
    child.once('error', reject);
  });
} catch (error) {
  stop('Unable to start Node.js program: ' + error.message);
}
// Node may close stderr with no newline after the final application write.
if (stderrBuffer) stderrLine(stderrBuffer);
// There is no guarantee that Node emits executionContextDestroyed on exit.
socket?.close();
const complete = inspected && !stopped && exitCode === 0 && eventCount > 0;
send(
  {
    type: 'done',
    complete,
    reason:
      stopReason ||
      (exitCode !== 0
        ? `Node.js exited with code ${exitCode}` +
          (applicationStderrTail.trim()
            ? `: ${applicationStderrTail.trim()}`
            : '')
        : ''),
    coverage,
  },
  false,
);
