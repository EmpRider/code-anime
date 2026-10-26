// Only explicit prepared returns with known invocation ancestry become arrows.
export function preparedReturns(events, entries) {
  const calls = new Map(entries.map((entry) => [entry.callId, entry]));
  const returns = new Map();
  for (const [offset, event] of events.entries()) {
    if (event.kind !== 'return') continue;
    const call = calls.get(event.callId);
    if (
      !call?.parentCallId ||
      call.parentCallId === call.callId ||
      !calls.has(call.parentCallId) ||
      (event.parentCallId && event.parentCallId !== call.parentCallId)
    )
      continue;
    const value = Object.hasOwn(event, 'result')
      ? (JSON.stringify(event.result) ?? 'value unavailable')
      : 'value unavailable';
    const evidence =
      event.certainty === 'mock'
        ? 'simulated'
        : (event.certainty ?? 'unverified');
    const item = {
      from: call.callId,
      to: call.parentCallId,
      index: offset + 1,
      label: `${call.symbol || call.callId} returns\n${value.length > 36 ? value.slice(0, 33) + '…' : value} (${evidence})`,
      description: `Prepared ${evidence} return at step ${offset + 1}: ${call.callId} to ${call.parentCallId}; ${value}`,
    };
    if (!returns.has(call.callId)) returns.set(call.callId, []);
    returns.get(call.callId).push(item);
  }
  return returns;
}

// Parallel to the call route, with endpoints clamped to the same card borders.
export function returnRoute(points, caller, callee, vertical, lane = 1) {
  const distance = 14 * lane;
  const normals = points.slice(1).map((point, index) => {
    const dx = point.x - points[index].x;
    const dy = point.y - points[index].y;
    const length = Math.hypot(dx, dy);
    if (!length) return { x: vertical ? 1 : 0, y: vertical ? 0 : 1 };
    return {
      x: (vertical ? dy : -dy) / length,
      y: (vertical ? -dx : dx) / length,
    };
  });
  const route = points.map((point, index) => {
    const before = normals[Math.max(0, index - 1)];
    const after = normals[Math.min(index, normals.length - 1)];
    // Bound sharp-corner miters so a return cannot shoot far outside its call route.
    const scale =
      distance / Math.max(0.5, 1 + before.x * after.x + before.y * after.y);
    return {
      x: point.x + (before.x + after.x) * scale,
      y: point.y + (before.y + after.y) * scale,
    };
  });
  for (const [index, node] of [
    [0, caller],
    [route.length - 1, callee],
  ]) {
    const point = route[index];
    const left = node.x - node.width / 2;
    const right = node.x + node.width / 2;
    const top = node.y - node.height / 2;
    const bottom = node.y + node.height / 2;
    point.x = Math.max(left, Math.min(right, point.x));
    point.y = Math.max(top, Math.min(bottom, point.y));
    // Fanout can attach to a perpendicular face; keep its boundary coordinate.
    if (Math.abs(points[index].x - left) < 0.01) point.x = left;
    if (Math.abs(points[index].x - right) < 0.01) point.x = right;
    if (Math.abs(points[index].y - top) < 0.01) point.y = top;
    if (Math.abs(points[index].y - bottom) < 0.01) point.y = bottom;
  }
  return route.reverse();
}
