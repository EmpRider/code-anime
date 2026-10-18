import { useCallback } from 'react';
import { useFlowStore } from '../store/flow-store';
import { usePlayback } from './use-playback';
import type { TraceEvent } from '../types/flow';

function steppingInvocation(event: TraceEvent | undefined): string | undefined {
  if (!event) return undefined;
  if (event.kind === 'console' && !event.stack?.length) return undefined;
  if (event.kind === 'throw' && !event.stack?.includes(event.callId))
    return event.stack?.at(-1);
  if (
    ['return', 'unresolved'].includes(event.kind) ||
    (event.kind === 'throw' && !event.stack?.includes(event.callId))
  )
    return event.parentCallId;
  return event.callId ?? event.stack?.at(-1);
}

function nestedThrowExitsInvocation(
  event: TraceEvent,
  callId: string,
  events: TraceEvent[],
): boolean {
  if (event.kind !== 'throw' || event.stack?.includes(callId)) return false;
  const visited = new Set<string>();
  let child: string | undefined = event.callId;
  while (child && !visited.has(child)) {
    if (child === callId) return true;
    visited.add(child);
    const inv = events.find((e) => e.callId === child);
    child = inv?.parentCallId;
  }
  return false;
}

export function useStepping() {
  const { flow, cursor, setCursor } = useFlowStore();
  const { pause } = usePlayback();

  const stepInto = useCallback(() => {
    pause();
    const events = flow?.trace?.events;
    if (!events || !cursor) return setCursor(cursor + 1);
    const callId = steppingInvocation(events[cursor - 1]);
    if (!callId) return setCursor(cursor + 1);
    for (let i = cursor; i < events.length; i++) {
      const next = events[i];
      if (
        next.callId !== callId &&
        !(next.kind === 'enter' && next.parentCallId === callId)
      )
        continue;
      return setCursor(i + 1);
    }
    setCursor(events.length);
  }, [flow, cursor, pause, setCursor]);

  const stepOver = useCallback(() => {
    pause();
    const events = flow?.trace?.events;
    if (!events || !cursor) return setCursor(cursor + 1);
    const current = events[cursor - 1];
    if (current.kind === 'console' && !current.stack?.length)
      return setCursor(cursor + 1);
    const callId = steppingInvocation(current);
    if (!callId) return setCursor(cursor + 1);
    for (let i = cursor; i < events.length; i++) {
      if (
        events[i].callId !== callId &&
        !nestedThrowExitsInvocation(events[i], callId, events)
      )
        continue;
      return setCursor(i + 1);
    }
    setCursor(events.length);
  }, [flow, cursor, pause, setCursor]);

  const stepOut = useCallback(() => {
    pause();
    const events = flow?.trace?.events;
    const current = events?.[cursor - 1];
    if (!current) return;
    const callId = steppingInvocation(current);
    if (!callId) {
      if (current.kind === 'console') return setCursor(cursor + 1);
      return;
    }
    for (let i = cursor; i < events.length; i++) {
      const next = events[i];
      const nestedUnwind = nestedThrowExitsInvocation(next, callId, events);
      if (next.callId !== callId && !nestedUnwind) continue;
      if (
        next.kind === 'return' ||
        next.kind === 'unresolved' ||
        (next.kind === 'throw' && !next.stack?.includes(callId))
      ) {
        return setCursor(i + 1);
      }
    }
    setCursor(events.length);
  }, [flow, cursor, pause, setCursor]);

  return { stepInto, stepOver, stepOut };
}