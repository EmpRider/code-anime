import type { ReadyVariant } from '../domain/flow-scene.js';
import type { TraceEvent } from '../domain/trace.js';

function parentInvocation(event: TraceEvent | undefined): string | undefined {
  if (event === undefined) return undefined;
  const parent =
    event.parentCallId ??
    (event.stack.at(-1) === event.callId
      ? event.stack.at(-2)
      : event.stack.at(-1));
  return parent === event.callId ? undefined : parent;
}

/** CA046 targets are variant-local UI cursors, never frame IDs or task labels. */
export function compileNavigation(
  events: readonly TraceEvent[],
): ReadyVariant['playback']['navigationByCursor'] {
  const count = events.length;
  const entries = new Map<string, TraceEvent>();
  for (const event of events) {
    if (event.kind === 'enter' && !entries.has(event.callId)) {
      entries.set(event.callId, event);
    }
  }

  const navigation: ReadyVariant['playback']['navigationByCursor'] = Array.from(
    { length: count + 1 },
    (_, cursor) => ({
      cursor,
      previousCursor: cursor === 0 ? null : cursor - 1,
      nextCursor: cursor === count ? null : cursor + 1,
      intoCursor: cursor === 0 && count > 0 ? 1 : null,
      overCursor: cursor === 0 && count > 0 ? 1 : null,
      outCursor: null,
    }),
  );

  // A backwards sweep keeps the nearest qualifying future event per invocation.
  // Unrelated callbacks cannot overwrite another invocation's progression.
  const into = new Map<string, number>();
  const over = new Map<string, number>();
  const out = new Map<string, number>();
  for (let cursor = count - 1; cursor > 0; cursor--) {
    const future = events[cursor]!;
    const step = cursor + 1;
    into.set(future.callId, step);
    over.set(future.callId, step);
    if (future.kind === 'enter') {
      const parent = parentInvocation(future);
      if (parent !== undefined) into.set(parent, step);
    }
    if (future.kind === 'return' || future.kind === 'unresolved') {
      out.set(future.callId, step);
    } else if (future.kind === 'throw') {
      const surviving = new Set(future.stack);
      const visited = new Set<string>();
      let callId: string | undefined = future.callId;
      while (callId !== undefined && !visited.has(callId)) {
        visited.add(callId);
        if (!surviving.has(callId)) {
          over.set(callId, step);
          out.set(callId, step);
        }
        callId = parentInvocation(entries.get(callId));
      }
    }

    const current = events[cursor - 1]!;
    let selected: string | undefined;
    if (current.kind === 'console' && current.stack.length === 0) {
      selected = undefined;
    } else if (
      current.kind === 'throw' &&
      !current.stack.includes(current.callId)
    ) {
      // A single throw can already have removed the immediate parent as well.
      selected = current.stack.at(-1);
    } else if (current.kind === 'return' || current.kind === 'unresolved') {
      // An exit snapshot may retain the completed child; step from its parent.
      selected = parentInvocation(current);
    } else {
      // Caller-only entry/resume stacks still belong to the entering invocation.
      selected = entries.has(current.callId)
        ? current.callId
        : current.stack.at(-1);
    }

    const row = navigation[cursor]!;
    if (selected === undefined) {
      row.intoCursor = step;
      row.overCursor = step;
      row.outCursor = current.kind === 'console' ? step : null;
    } else {
      // Exhaustion is a visible scenario boundary, not evidence of a return.
      row.intoCursor = into.get(selected) ?? count;
      row.overCursor = over.get(selected) ?? count;
      row.outCursor = out.get(selected) ?? count;
    }
  }
  return navigation;
}
