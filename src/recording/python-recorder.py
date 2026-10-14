"""Bundled Python recorder. Runs only on explicit record_execution.

The protocol is written to the original stdout; application text writes become
console events. This is instrumentation, not a sandbox for untrusted programs.
"""
import sys
import os
import json
import runpy
import tokenize
import math
import threading
import dis
import itertools
import asyncio
import types

root, entry, max_events, max_bytes, *arguments = sys.argv[1:]
root = os.path.realpath(root)
entry = os.path.realpath(entry)
max_events, max_bytes = int(max_events), int(max_bytes)
protocol = sys.stdout
frames = {}
suspended = set()
tasks = {}
sources = {}
paths = {}
project_classes = {}
count = 0
calls = 0
size = 0
source_bytes = 0
# Keep source snapshots bounded beneath the 10 MiB stored-session budget;
# execution events have their own separately configurable trace-byte budget.
MAX_SOURCE_FILE_BYTES = 2 * 1024 * 1024
MAX_SOURCE_TOTAL_BYTES = 4 * 1024 * 1024
active = True
scope = "Main-thread Python user code for this input, including generator/coroutine suspension and single-thread asyncio tasks. Line events show state BEFORE the highlighted line; return events show state after returning. User-defined instance fields and native slots are snapshotted without invoking application accessors; methods and dependency object internals remain opaque. Exception arguments are observed without invoking user-defined formatting. Coroutine await/suspend events are scheduler transitions, not awaited results. Async task stacks are observed Python frames, not inferred causal chains. Native/dependency internals, additional threads or processes, and binary console writes are not captured. Values are bounded; unavailable fields are explicitly marked."


class Boundary(BaseException):
    pass


def send(message, budget=True):
    global size
    encoded = json.dumps(message, ensure_ascii=True, allow_nan=False, separators=(',', ':')) + '\n'
    if budget and size + len(encoded) > max_bytes:
        raise Boundary('Configured trace byte budget reached')
    size += len(encoded)
    protocol.write(encoded)
    protocol.flush()


def instance_properties(item, kind, depth, seen):
    """Read native instance storage without invoking application accessors.

    The exact builtin dict and member/getset descriptors expose stored fields;
    arbitrary __dict__ properties, __getattribute__, and slot-like descriptors
    supplied by user code must never run during a debugger snapshot.
    """
    properties = {}
    omitted = False
    classes = type.__getattribute__(kind, '__mro__')
    for cls in classes:
        definitions = type.__getattribute__(cls, '__dict__')
        descriptor = definitions.get('__dict__')
        if type(descriptor) is not types.GetSetDescriptorType:
            continue
        try:
            stored = descriptor.__get__(item, kind)
        except (AttributeError, TypeError):
            continue
        if type(stored) is dict:
            for name, child in stored.items():
                if type(name) is not str or name in ('__dict__', '__weakref__'):
                    continue
                if len(properties) >= 40:
                    omitted = True
                    break
                properties[name] = value(child, depth + 1, seen)
        break
    for cls in classes:
        for name, descriptor in type.__getattribute__(cls, '__dict__').items():
            if type(descriptor) is not types.MemberDescriptorType or name in ('__dict__', '__weakref__') or name in properties:
                continue
            if len(properties) >= 40:
                omitted = True
                break
            try:
                child = descriptor.__get__(item, kind)
            except AttributeError:  # Uninitialized slot.
                continue
            properties[name] = value(child, depth + 1, seen)
        if omitted:
            break
    return properties, omitted


def is_project_class(kind):
    # Do not recursively snapshot runtime and dependency objects that happen
    # to be reachable from a user's locals (modules, functions, import state).
    # Their internals are outside the recorded user-code execution scope.
    identity = id(kind)
    cached = project_classes.get(identity)
    if cached is not None and cached[0] is kind:
        return cached[1]
    module_name = type.__getattribute__(kind, '__module__')
    if module_name == '__main__':
        included = True  # runpy executes the requested entry as __main__.
    else:
        module = sys.modules.get(module_name)
        filename = module.__dict__.get('__file__') if type(module) is types.ModuleType else None
        if type(filename) is str:
            try:
                actual = os.path.realpath(filename)
                rel = os.path.relpath(actual, root)
                included = rel != '..' and not rel.startswith('..' + os.sep) and not os.path.isabs(rel)
                included = included and not any(
                    part in {'.git', '.venv', 'venv', 'node_modules', 'site-packages'}
                    for part in rel.split(os.sep)
                )
            except (OSError, ValueError):
                # A Windows import may reside on another drive, for which
                # relpath raises ValueError; its internals are out of scope.
                included = False
        else:
            included = False
    # Retain the class reference so dynamically generated classes cannot reuse
    # a cached id with a different origin during a long recording.
    project_classes[identity] = (kind, included)
    return included


def value(item, depth=0, seen=None):
    kind = type(item)
    if item is None or kind is bool:
        return item
    if kind is int:
        return item if abs(item) <= 9007199254740991 else {'$integer': str(item)}
    if kind is float:
        return item if math.isfinite(item) else {'$float': str(item)}
    if kind is str:
        return item if len(item) <= 2000 else {'$preview': item[:2000], '$unavailable': 'String exceeds 2000 characters'}
    if depth >= 4:
        return {'$unavailable': 'Value nesting exceeds snapshot budget'}
    seen = set() if seen is None else seen
    if id(item) in seen:
        return {'$unavailable': 'Repeated or cyclic reference'}
    seen = seen | {id(item)}
    if kind is not list and kind is not tuple and kind is not dict:
        name = type.__getattribute__(kind, '__name__')
        if not is_project_class(kind):
            return {'$type': name, '$unavailable': 'Dependency or runtime object internals not inspected'}
        properties, omitted = instance_properties(item, kind, depth, seen)
        if properties:
            return {
                '$type': name,
                'properties': properties,
                '$unavailable': ('Additional instance fields omitted' if omitted else
                                 'Methods, descriptors and internal state not inspected'),
            }
        return {'$type': name, '$unavailable': 'Opaque value; no user repr or accessors invoked'}
    if kind is dict:
        result = {}
        for key, child in itertools.islice(item.items(), 40):
            if type(key) is not str:
                return {'$unavailable': 'Dictionary with non-string keys'}
            result[key] = value(child, depth + 1, seen)
    else:
        result = [value(child, depth + 1, seen) for child in item[:40]]
    return result if len(item) <= 40 else {'$preview': result, '$unavailable': 'Collection exceeds 40 entries'}


def local_values(frame):
    result = {}
    for name, item in frame.f_locals.items():
        if name.startswith('__'):
            continue
        if len(result) >= 40:
            result['$unavailable'] = 'Locals exceed 40 entries'
            break
        result[name] = value(item)
    return result


def user_file(filename):
    global source_bytes
    if filename in paths:
        return paths[filename]
    actual = os.path.realpath(filename)
    try:
        relative = os.path.relpath(actual, root)
        parts = relative.split(os.sep)
        included = not relative.startswith('..' + os.sep) and relative != '..' and not os.path.isabs(relative)
        included = included and not any(p in {'.git', '.venv', 'venv', 'node_modules', 'site-packages', '__pycache__'} for p in parts)
        included = included and actual != os.path.realpath(__file__) and os.path.isfile(actual)
    except (OSError, ValueError):
        included = False
    if not included:
        paths[filename] = None
        return None
    relative = relative.replace(os.sep, '/')
    if relative not in sources:
        if os.path.getsize(actual) > MAX_SOURCE_FILE_BYTES:
            raise Boundary('Source file exceeds 2 MiB snapshot budget: ' + relative)
        with tokenize.open(actual) as source:
            content = source.read()
        source_bytes += len(content.encode('utf8'))
        if source_bytes > MAX_SOURCE_TOTAL_BYTES:
            raise Boundary('Source snapshots exceed 4 MiB budget')
        sources[relative] = content
        send({'type': 'source', 'file': relative, 'content': content})
    paths[filename] = relative
    return relative


def chain(frame):
    result = []
    while frame:
        if id(frame) in frames:
            result.append(frame)
        frame = frame.f_back
    return list(reversed(result))


def task_identity():
    try:
        task = asyncio.current_task()
    except RuntimeError:
        return 'main'
    if task is None:
        return 'main'
    if task not in tasks:
        tasks[task] = 'task-' + str(len(tasks) + 1)
    return tasks[task]


def emit(frame, kind, **extra):
    global count
    if count >= max_events:
        raise Boundary('Configured event budget reached')
    file = user_file(frame.f_code.co_filename)
    if not file:
        return
    stack_frames = chain(frame)
    if kind in ('return', 'yield') or extra.get('suspending') or extra.get('unwinding'):
        stack_frames = stack_frames[:-1]
    own = frames[id(frame)]
    count += 1
    event = {
        'id': 'event-' + str(count), 'kind': kind,
        'symbolId': file + ':' + getattr(frame.f_code, 'co_qualname', frame.f_code.co_name),
        'callId': own, 'label': kind + ' ' + frame.f_code.co_name,
        'source': {'file': file, 'line': max(1, frame.f_lineno), 'endLine': max(1, frame.f_lineno)},
        'values': {
            'thread': 'main',
            'task': task_identity(),
            'phase': 'before' if kind == 'statement' else 'after',
        },
        'stack': [frames[id(parent)] for parent in stack_frames],
        'locals': {frames[id(parent)]: local_values(parent) for parent in stack_frames},
        'certainty': 'observed',
    }
    parent = chain(frame.f_back)
    if parent:
        event['parentCallId'] = frames[id(parent[-1])]
    event.update(extra)
    if 'values' in extra:
        event['values'] = {
            'thread': 'main',
            'task': task_identity(),
            'phase': 'before' if kind == 'statement' else 'after',
            **extra['values'],
        }
    if kind == 'statement':
        event['note'] = 'State before this source line executes'
    event.pop('unwinding', None)
    event.pop('suspending', None)
    send({'type': 'event', 'event': event})


def trace(frame, event, arg):
    global calls
    if not active or event not in ('call', 'line', 'return', 'exception'):
        return trace
    if event == 'call' and frame.f_code.co_filename in ('<string>', '<stdin>') and id(frame.f_back) in frames:
        raise Boundary('Dynamically compiled code has no verifiable source snapshot')
    if not user_file(frame.f_code.co_filename):
        return None
    if threading.active_count() > 1:
        raise Boundary('Multiple threads detected; this recorder supports synchronous main-thread execution')
    if event == 'call':
        if id(frame) in suspended:
            suspended.remove(id(frame))
            emit(frame, 'resume', note='Resuming the same generator or coroutine invocation')
        else:
            calls += 1
            frames[id(frame)] = 'call-' + str(calls)
            emit(frame, 'enter', inputs=local_values(frame))
    elif id(frame) in frames:
        if event == 'line':
            emit(frame, 'statement')
        elif event == 'exception':
            # BaseException's native args descriptor bypasses overridden
            # properties and user __str__/__repr__; arbitrary payload objects
            # remain bounded snapshots with explicit unknowns.
            exception_type, exception_value, _ = arg
            arguments = BaseException.args.__get__(exception_value, BaseException)
            name = type.__getattribute__(exception_type, '__name__')
            emit(frame, 'throw', result={'type': name, 'args': value(arguments)},
                 note='Python reported exception propagation: ' + name)
        elif event == 'return':
            opcode = dis.opname[frame.f_code.co_code[frame.f_lasti]]
            if opcode in ('YIELD_VALUE', 'YIELD_FROM'):
                suspended.add(id(frame))
                if frame.f_code.co_flags & (0x80 | 0x200):
                    emit(frame, 'await', suspending=True,
                         note='Coroutine suspended; await result not yet available')
                else:
                    emit(frame, 'yield', result=value(arg),
                         note='Generator yielded; invocation remains suspended')
            elif arg is None and opcode not in ('RETURN_VALUE', 'RETURN_CONST'):
                emit(frame, 'unresolved', unwinding=True, note='Exception unwound this frame; no normal return value')
            else:
                emit(frame, 'return', result=value(arg))
            if id(frame) not in suspended:
                del frames[id(frame)]
    return trace


class Output:
    encoding = 'utf-8'
    def __init__(self, stream):
        self.stream = stream
    def write(self, text):
        if active and text:
            frame = sys._getframe(1)
            parents = chain(frame)
            if parents:
                emit(parents[-1], 'console', output=text, values={'stream': self.stream})
        return len(text)
    def flush(self):
        pass
    def isatty(self):
        return False


complete = False
reason = ''
sys.argv = [entry] + arguments
sys.path.insert(0, os.path.dirname(entry))
sys.stdout, sys.stderr = Output('stdout'), Output('stderr')
try:
    sys.settrace(trace)
    runpy.run_path(entry, run_name='__main__')
    complete = sys.gettrace() is trace
    if not complete:
        reason = 'Application replaced the trace hook'
except Boundary as error:
    reason = str(error)
except SystemExit as error:
    # A zero/None SystemExit is a normal, fully observed Python termination.
    # The exception unwinds user frames, so it must not create normal returns,
    # but the execution is complete when it deliberately ends with success.
    exit_code = error.code
    complete = exit_code is None or (
        type(exit_code) in (int, bool) and exit_code == 0
    )
    if complete:
        reason = 'Program terminated normally via SystemExit(' + (
            'None' if exit_code is None else '0'
        ) + ')'
    else:
        # Avoid invoking __str__ on a user-defined exception payload.
        described = (
            str(exit_code)[:200]
            if type(exit_code) in (int, bool, str)
            else type(exit_code).__name__
        )
        reason = 'Program exited via SystemExit; exit code: ' + described
except BaseException as error:
    reason = 'Program terminated with ' + type(error).__name__
finally:
    active = False
    sys.settrace(None)
    send({'type': 'done', 'complete': complete, 'reason': reason, 'coverage': scope}, budget=False)
