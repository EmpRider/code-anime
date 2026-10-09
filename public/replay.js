// Immutable event snapshots make Previous/seek independent of playback history.
export function replayState(events, cursor) {
  const index = Math.min(events.length, Math.max(0, Math.trunc(cursor)));
  const event = index ? events[index - 1] : undefined;
  return {
    event,
    stack: [...(event?.stack ?? [])],
    locals: structuredClone(event?.locals ?? {}),
    objects: structuredClone(event?.objects ?? {}),
  };
}
