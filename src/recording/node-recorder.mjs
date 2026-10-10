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
let inspectorUrl;
let inspectorAttached = false;
const inspectorHelpSeen = new Set();
let inspected = false;
let previousPause;
let repeatedPause = 0;
let pausedInFlight = 0;
let closeRequested = false;

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
  // is still in flight. Closing here would reject that request and turn a
  // successfully completed recording into "Debugger disconnected".
  closeRequested = true;
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
      for (const item of entries)
        result[Number(item.name)] = item.value
          ? await remoteValue(item.value, depth + 1, visited)
          : { $unavailable: 'Accessor not evaluated' };
      return result;
    }
    // JSON turns array holes into null and drops trailing holes. Preserve the
    // observed length and exact own keys instead of manufacturing values.
    const elements = {};
    const namedProperties = {};
    for (const item of limited)
      Object.defineProperty(
        isElement(item.name) ? elements : namedProperties,
        item.name,
        {
          value: item.value
            ? await remoteValue(item.value, depth + 1, visited)
            : { $unavailable: 'Accessor not evaluated' },
          enumerable: true,
        },
      );
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
  for (const item of limited) {
    Object.defineProperty(result, item.name, {
      value: item.value
        ? await remoteValue(item.value, depth + 1, visited)
        : { $unavailable: 'Accessor not evaluated' },
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
  for (const scope of frame.scopeChain) {
    if (!['local', 'block', 'catch', 'script', 'module'].includes(scope.type))
      continue;
    const properties = await request('Runtime.getProperties', {
      objectId: scope.object.objectId,
      ownProperties: true,
    });
    for (const property of properties.result) {
      if (
        !property.enumerable ||
        property.name.startsWith('__') ||
        ['module', 'exports', 'require'].includes(property.name)
      )
        continue;
      if (seen++ >= 40) {
        values.$unavailable = 'Locals exceed 40 entries';
        return values;
      }
      if (Object.hasOwn(values, property.name)) continue;
      Object.defineProperty(values, property.name, {
        value: property.value
          ? await remoteValue(property.value)
          : { $unavailable: 'Accessor not evaluated' },
        enumerable: true,
        configurable: true,
      });
    }
  }
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
  const lines = scripts.get(frame.raw.location.scriptId)?.sourceLines;
  if (!lines || !/\bawait\b/.test(lines[frame.generatedLine - 1] || ''))
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
    await request('Debugger.setBreakpoint', {
      location: { scriptId: frame.raw.location.scriptId, lineNumber: next },
    });
    resumeBreakpoints.add(key);
  }
  return true;
}

async function breakpointAtEntry(frame) {
  const key = `${frame.raw.location.scriptId}:${frame.generatedLine - 1}`;
  if (entryBreakpoints.has(key)) return;
  const { breakpointId } = await request('Debugger.setBreakpoint', {
    location: {
      scriptId: frame.raw.location.scriptId,
      lineNumber: frame.generatedLine - 1,
    },
  });
  entryBreakpoints.set(key, breakpointId);
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
    !(
      stack[common].awaiting &&
      frames[common].generatedLine === stack[common].entryLine &&
      params.hitBreakpoints?.includes(
        entryBreakpoints.get(
          `${frames[common].raw.location.scriptId}:${frames[common].generatedLine - 1}`,
        ),
      )
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
    if (old.awaiting) {
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
    const observedReturn = Object.hasOwn(old, 'observedReturn');
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
        current.generatedLine > suspension.generatedLine;
      current.resuming = resuming;
      current.callId = resuming ? suspension.callId : `call-${++nextCall}`;
      current.entryLine = resuming
        ? suspension.entryLine
        : current.generatedLine;
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
      stack[index].generated = current.generated;
      stack[index].file = current.file;
      stack[index].symbolId = current.symbolId;
    }
    snapshots[current.callId] = await locals(current.raw);
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
function stderrLine(text) {
  // Match whole, known Inspector notices, while preserving application text
  // verbatim (including trailing spaces, carriage returns and final fragments).
  const line = text.replace(/\r?\n$/, '');
  const shutdownNotice = 'Waiting for the debugger to disconnect...';
  if (inspectorUrl && line.endsWith(shutdownNotice)) {
    // Node may append the notice to an unterminated application stderr write.
    // The prefix belongs to the application and has no synthetic newline.
    const prefix = line.slice(0, -shutdownNotice.length);
    if (prefix) applicationStderr(prefix);
    closeDebuggerWhenIdle();
    return;
  }
  if (inspectorUrl && line.endsWith(`Debugger ending on ${inspectorUrl}`)) {
    const prefix = line.slice(0, -`Debugger ending on ${inspectorUrl}`.length);
    if (prefix) applicationStderr(prefix);
    return;
  }
  const listening = line.match(/^Debugger listening on (ws:\/\/\S+)$/);
  if (listening && !inspectorUrl) {
    inspectorUrl = listening[1];
    connect(inspectorUrl).catch((error) =>
      stop('Inspector setup: ' + error.message),
    );
  } else if (
    inspectorUrl &&
    !inspectorAttached &&
    line === 'Debugger attached.'
  ) {
    inspectorAttached = true;
  } else if (
    inspectorUrl &&
    !inspected &&
    !inspectorAttached &&
    !inspectorHelpSeen.has(line) &&
    (line === 'For help, see: https://nodejs.org/en/docs/inspector' ||
      line ===
        'For help, see: https://nodejs.org/learn/getting-started/debugging')
  ) {
    // Both documented Inspector help variants may appear during startup.
    // Retain subsequent identical lines written by the application.
    inspectorHelpSeen.add(line);
  } else {
    applicationStderr(text);
  }
}

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
  for (let attempt = 0; attempt < 4; attempt++) {
    if (stopped || child.exitCode !== null)
      throw new Error('Inspector connection stopped before attachment');
    const candidate = new WebSocket(url);
    socket = candidate;
    try {
      await new Promise((resolve, reject) => {
        candidate.addEventListener('open', resolve, { once: true });
        candidate.addEventListener(
          'error',
          () => reject(new Error('WebSocket connection failed')),
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
      if (attempt === 3 || stopped || child.exitCode !== null) throw error;
      await new Promise((resolve) => setTimeout(resolve, 80 * (attempt + 1)));
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
          if (!stopped)
            await request(
              lastFrame?.awaiting
                ? 'Debugger.resume'
                : repeatedPause > 0
                  ? 'Debugger.stepOver'
                  : 'Debugger.stepInto',
            );
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
