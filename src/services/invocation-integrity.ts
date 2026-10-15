import type { TraceEvent } from '../domain/trace.js';

// Validate agent-authored invocation relationships without interpreting or
// executing the analyzed language. The first one-shot event may be a snapshot
// inside an existing mock frame; every subsequent transition must be coherent.
export function checkInvocationIntegrity(
  chunks: readonly (readonly TraceEvent[])[],
  complete = false,
) {
  // Each simulated async task has its own invocation stack. An `await` or
  // callback may interleave with another task without popping its frames.
  const active = new Map<string, string[]>();
  // A legacy one-shot trace may start inside unknown frames. Nevertheless,
  // every invocation explicitly entered in this trace must close before the
  // agent may mark the simulated scenario complete.
  const explicitlyEntered = new Set<string>();
  const used = new Set<string>();
  // Historical one-shot snapshots may begin inside a frame whose entry was
  // omitted, so we cannot infer a fully closed lifecycle for those frames.
  for (const chunk of chunks) {
    for (const event of chunk) {
      const task = event.taskId ?? 'main';
      const stack = event.stack;
      if (new Set(stack).size !== stack.length)
        throw new Error(`Event ${event.id} repeats an invocation in its stack`);

      let before = active.get(task);
      if (!before) {
        // A one-shot trace can start in an already active method. Preserve
        // that compatibility, but never infer subsequent stack transitions.
        before =
          event.kind === 'return'
            ? [...stack, event.callId]
            : event.kind === 'enter'
              ? stack.slice(0, -1)
              : stack;
        if (new Set(before).size !== before.length)
          throw new Error(
            `Event ${event.id} repeats an invocation in its inferred pre-event stack`,
          );
        // Historical one-shot snapshots can start inside a frame, but they
        // must not borrow an invocation already owned by another task.
        for (const id of before) {
          if (used.has(id))
            throw new Error(
              `Event ${event.id} shares invocation ID ${id} across mock tasks`,
            );
          used.add(id);
        }
      }

      const same =
        stack.length === before.length &&
        stack.every((id, index) => id === before[index]);
      const push =
        stack.length === before.length + 1 &&
        stack.at(-1) === event.callId &&
        before.every((id, index) => id === stack[index]);
      const pop =
        stack.length === before.length - 1 &&
        before.at(-1) === event.callId &&
        stack.every((id, index) => id === before[index]);
      const unwind =
        stack.length <= before.length &&
        stack.every((id, index) => id === before[index]);

      let parent: string | undefined;
      switch (event.kind) {
        case 'enter':
          if (!push)
            throw new Error(
              `Event ${event.id} must push its invocation onto the previous stack`,
            );
          parent = before.at(-1);
          break;
        case 'call':
          if (!push && (!same || before.at(-1) !== event.callId))
            throw new Error(
              `Event ${event.id} has an inconsistent call stack transition`,
            );
          parent = push ? before.at(-1) : before.at(-2);
          break;
        case 'return':
          if (!pop)
            throw new Error(
              `Event ${event.id} must return from the active invocation`,
            );
          parent = stack.at(-1);
          break;
        case 'throw':
          if (before.at(-1) !== event.callId || !unwind)
            throw new Error(
              `Event ${event.id} must unwind a suffix of its active stack`,
            );
          parent = before.at(-2);
          break;
        default:
          if (!same || before.at(-1) !== event.callId)
            throw new Error(
              `Event ${event.id} changes its stack without a call, return or throw`,
            );
          parent = before.at(-2);
      }
      if (event.parentCallId !== undefined && event.parentCallId !== parent)
        throw new Error(`Event ${event.id} has an inconsistent parentCallId`);
      if (push) {
        if (used.has(event.callId))
          throw new Error(
            `Event ${event.id} reuses invocation ID ${event.callId}`,
          );
        used.add(event.callId);
        // A one-shot `call` may also open a new mock invocation. Builder
        // `call` operations that annotate the current frame do not push.
        explicitlyEntered.add(event.callId);
      }
      active.set(task, stack);
    }
  }
  if (complete)
    for (const [task, remaining] of active) {
      const unfinished = remaining.filter((id) => explicitlyEntered.has(id));
      if (unfinished.length)
        throw new Error(
          `Completed mock animation retains active invocations: ${unfinished.join(', ')} (task ${task}); append their returns or finish with complete:false`,
        );
    }
}
