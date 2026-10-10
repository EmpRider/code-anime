/**
 * Opt-in Node.js runtime recorder. The inspected program runs in its own child
 * process; this file belongs to the installed MCP package, not the workspace.
 * Only debugger-observed locations and values become `observed` trace events.
 */
import { spawn } from 'node:child_process';
import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, sep } from 'node:path';
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
let childError = '';
let inspected = false;
let previousPause;
let repeatedPause = 0;

const coverage =
  'Node.js JavaScript execution observed via V8 Inspector, in one process for this input. ' +
  'Source-line snapshots precede execution; parameters, block locals and own data properties ' +
  'are bounded. Calls are identified from debugger-visible JavaScript frames. ' +
  'Exceptions thrown in active user source frames are recorded when V8 reports their values. ' +
  'Frame disappearance is recorded without an invented return value or exception cause. ' +
  'Stdout/stderr bytes are real, but their association with the last paused frame may lag ' +
  'as pipes flush. Native frames, worker threads, child processes, timers after process exit, ' +
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

async function projectFile(scriptId) {
  if (scripts.has(scriptId) && scripts.get(scriptId)?.checked)
    return scripts.get(scriptId).file;
  const script = scripts.get(scriptId);
  if (!script?.url.startsWith('file://')) return undefined;
  let filename;
  try {
    filename = await realpath(fileURLToPath(script.url));
  } catch {
    return undefined;
  }
  const path = relative(root, filename);
  const valid =
    path !== '..' &&
    !path.startsWith('..' + sep) &&
    !isAbsolute(path) &&
    !path
      .split(sep)
      .some((part) => ['node_modules', '.git', 'dist', '.venv'].includes(part));
  script.checked = true;
  if (!valid) return undefined;
  const info = await stat(filename);
  if (!info.isFile() || info.size > 512 * 1024)
    throw new Error('Source exceeds 512 KiB budget: ' + path);
  const file = path.split(sep).join('/');
  script.file = file;
  if (!sources.has(file)) {
    // The debugger returns the source that V8 compiled, even if the file on disk
    // changes while it is running. Do not substitute a newly read file.
    const { scriptSource } = await request('Debugger.getScriptSource', {
      scriptId,
    });
    script.sourceLines = scriptSource.split(/\r?\n/);
    sourceBytes += Buffer.byteLength(scriptSource);
    if (sourceBytes > 2 * 1024 * 1024)
      throw new Error('Source snapshots exceed 2 MiB budget');
    send({ type: 'source', file, content: scriptSource });
    sources.add(file);
  }
  return file;
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
  if (object.subtype === 'array' && entries.length <= 40) {
    const result = [];
    for (const item of limited) {
      const index = Number(item.name);
      if (!Number.isSafeInteger(index) || index < 0 || index >= 40) continue;
      result[index] = item.value
        ? await remoteValue(item.value, depth + 1, visited)
        : { $unavailable: 'Accessor not evaluated' };
    }
    return result;
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
  if (!lines || !/\bawait\b/.test(lines[frame.line - 1] || '')) return false;
  const next = lines.findIndex(
    (line, index) =>
      index >= frame.line && line.trim() && !line.trim().startsWith('//'),
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
  const key = `${frame.raw.location.scriptId}:${frame.line - 1}`;
  if (entryBreakpoints.has(key)) return;
  const { breakpointId } = await request('Debugger.setBreakpoint', {
    location: {
      scriptId: frame.raw.location.scriptId,
      lineNumber: frame.line - 1,
    },
  });
  entryBreakpoints.set(key, breakpointId);
}

async function paused(params) {
  const frames = [];
  for (const frame of [...params.callFrames].reverse()) {
    const file = await projectFile(frame.location.scriptId);
    if (!file) continue;
    const symbol = frame.functionName || '<module>';
    frames.push({
      raw: frame,
      file,
      line: frame.location.lineNumber + 1,
      symbol,
      signature: `${frame.location.scriptId}:${frame.functionLocation?.lineNumber ?? 0}:${symbol}`,
      symbolId: `${file}:${symbol}`,
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
      frames[common].line === stack[common].entryLine &&
      params.hitBreakpoints?.includes(
        entryBreakpoints.get(
          `${frames[common].raw.location.scriptId}:${frames[common].line - 1}`,
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
        source: { file: old.file, line: old.line, endLine: old.line },
        values: { task: old.callId, thread: 'main' },
        stack: [...stack.map((frame) => frame.callId), old.callId],
        certainty: 'observed',
        note: 'Paused on await before the frame left the synchronous debugger stack',
      });
      continue;
    }
    emit({
      kind: 'unresolved',
      symbolId: old.symbolId,
      callId: old.callId,
      ...(stack.at(-1) ? { parentCallId: stack.at(-1).callId } : {}),
      label: `exited ${old.symbol}`,
      source: { file: old.file, line: old.line, endLine: old.line },
      values: { task: 'main', thread: 'main' },
      stack: stack.map((frame) => frame.callId),
      note: 'Frame disappeared; debugger did not establish the return value or exception cause',
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
        current.line > suspension.line;
      current.resuming = resuming;
      current.callId = resuming ? suspension.callId : `call-${++nextCall}`;
      current.entryLine = resuming ? suspension.entryLine : current.line;
      stack.push(current);
      if (resuming) {
        suspendedCalls.delete(current.callId);
        emit({
          kind: 'resume',
          symbolId: current.symbolId,
          callId: current.callId,
          label: `resume ${current.symbol}`,
          source: {
            file: current.file,
            line: current.line,
            endLine: current.line,
          },
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
    }
    snapshots[current.callId] = await locals(current.raw);
    if (index >= common && !current.resuming) {
      emit({
        kind: 'enter',
        symbolId: current.symbolId,
        callId: current.callId,
        ...(index ? { parentCallId: frames[index - 1].callId } : {}),
        label: `enter ${current.symbol}`,
        source: {
          file: current.file,
          line: current.line,
          endLine: current.line,
        },
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
      source: { file: active.file, line: active.line, endLine: active.line },
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
      source: { file: active.file, line: active.line, endLine: active.line },
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
      source: { file: active.file, line: active.line, endLine: active.line },
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
    const frame = lastFrame;
    if (!frame) return;
    emit({
      kind: 'console',
      symbolId: frame.symbolId,
      callId: frame.callId,
      label: `console ${frame.symbol}`,
      source: { file: frame.file, line: frame.line, endLine: frame.line },
      values: { task: 'main', thread: 'main', stream },
      stack: frame.stack,
      locals: frame.locals,
      output: data,
      certainty: 'observed',
      note: 'Observed process output; last paused source position is approximate',
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
child.stderr.on('data', (data) => {
  stderrBuffer += data;
  let index;
  while ((index = stderrBuffer.indexOf('\n')) >= 0) {
    const line = stderrBuffer.slice(0, index).trimEnd();
    stderrBuffer = stderrBuffer.slice(index + 1);
    const match = line.match(/Debugger listening on (ws:\/\/\S+)/);
    if (match && !socket) {
      connect(match[1]).catch((error) =>
        stop('Inspector setup: ' + error.message),
      );
    } else if (line.startsWith('Waiting for the debugger to disconnect')) {
      socket?.close();
    } else if (!/^(For help, see:|Debugger attached\.)/.test(line)) {
      childError = (childError + line + '\n').slice(-4096);
      output(line + '\n', 'stderr');
    }
  }
});

async function connect(url) {
  socket = new WebSocket(url);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true });
    socket.addEventListener(
      'error',
      () => reject(new Error('WebSocket connection failed')),
      { once: true },
    );
  });
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
        }
      })();
    } else if (
      packet.method === 'Runtime.executionContextDestroyed' &&
      inspected
    ) {
      socket.close();
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
// There is no guarantee that Node emits executionContextDestroyed on exit.
socket?.close();
const complete = inspected && !stopped && exitCode === 0 && eventCount > 0;
send(
  {
    type: 'done',
    complete,
    reason:
      stopReason ||
      (exitCode ? `Node.js exited with code ${exitCode}` : childError.trim()),
    coverage,
  },
  false,
);
