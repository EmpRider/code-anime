// Reserve collision-free positions for native ELK edge labels in diagram space.
// Geometry is static; labels are omitted when no unobstructed box exists.
const overlaps = (a, b) =>
  a.x < b.x + b.width + 6 &&
  a.x + a.width + 6 > b.x &&
  a.y < b.y + b.height + 6 &&
  a.y + a.height + 6 > b.y;

export function reserveRouteLabel(points, text, obstacles, reservations) {
  if (!Array.isArray(points) || points.length < 2 || !text) return null;
  const lines = String(text).split('\n');
  const width = Math.max(46, ...lines.map((line) => line.length * 6 + 20));
  const height = lines.length * 14 + 12;
  const segments = [];
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    if (![a.x, a.y, b.x, b.y].every(Number.isFinite)) return null;
    const horizontal = a.y === b.y;
    const vertical = a.x === b.x;
    const length = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    if ((!horizontal && !vertical) || length < 32) continue;
    segments.push({ a, b, horizontal, length });
  }
  segments.sort((a, b) => b.length - a.length);
  for (const { a, b, horizontal } of segments) {
    for (const ratio of [0.5, 0.25, 0.75, 0.125, 0.875]) {
      const midX = a.x + (b.x - a.x) * ratio;
      const midY = a.y + (b.y - a.y) * ratio;
      for (const side of [-1, 1]) {
        const box = horizontal
          ? {
              x: midX - width / 2,
              y: midY + (side < 0 ? -height - 10 : 10),
              width,
              height,
            }
          : {
              x: midX + (side < 0 ? -width - 10 : 10),
              y: midY - height / 2,
              width,
              height,
            };
        if (
          [...obstacles, ...reservations].some((other) =>
            overlaps(box, other),
          )
        )
          continue;
        reservations.push(box);
        return box;
      }
    }
  }
  return null;
}
