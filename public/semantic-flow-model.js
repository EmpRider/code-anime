import { buildMethodGroups } from './flow-overview.js';

// Only brace-delimited structures with unambiguous line ranges are grouped.
// Unsupported syntax stays in prepared order; source expressions are never run.
function structures(source, file) {
  if (!/\.(?:[cm]?[jt]sx?|java|cs|kt|c|cpp|h|go|rs)$/.test(file)) return [];
  const masked = source.replace(
    /\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g,
    (value) => value.replace(/[^\n]/g, ' '),
  );
  const pairs = new Map(),
    stack = [],
    lines = [];
  let line = 1;
  for (let i = 0; i < masked.length; i++) {
    lines[i] = line;
    if (masked[i] === '\n') line++;
    if ('({'.includes(masked[i])) stack.push(i);
    else if (')}'.includes(masked[i])) {
      const open = stack.pop();
      if (
        open !== undefined &&
        ((masked[open] === '(' && masked[i] === ')') ||
          (masked[open] === '{' && masked[i] === '}'))
      )
        pairs.set(open, i);
      else return [];
    }
  }
  if (stack.length) return [];
  const skip = (offset) => {
    while (/\s/.test(masked[offset] ?? '') && offset < masked.length) offset++;
    return offset;
  };
  function block(start, keyword) {
    let open = skip(start + keyword.length);
    if (masked[open] === '(') {
      const close = pairs.get(open);
      if (close === undefined) return;
      open = skip(close + 1);
    }
    if (masked[open] !== '{' || !pairs.has(open)) return;
    return {
      start,
      open,
      end: pairs.get(open),
      line: lines[start],
      bodyLine: lines[open],
      title: source.slice(start, open).trim(),
      keyword,
    };
  }
  const all = [];
  for (const match of masked.matchAll(
    /\b(if|for|while|foreach|try|switch)\b/g,
  )) {
    const main = block(match.index, match[0]);
    if (!main) continue;
    const branches = [
      {
        label:
          main.keyword === 'if'
            ? 'Yes · condition true'
            : main.keyword === 'try'
              ? 'Try · normal path'
              : 'Body',
        start: main.open + 1,
        end: main.end,
        line: main.line,
      },
    ];
    let end = main.end;
    if (main.keyword === 'if' || main.keyword === 'try') {
      while (true) {
        const next = skip(end + 1);
        const keyword = /^(else|catch|finally)\b/.exec(masked.slice(next))?.[1];
        if (
          !keyword ||
          (main.keyword === 'if' ? keyword !== 'else' : keyword === 'else')
        )
          break;
        const part = block(next, keyword);
        if (!part) break;
        branches.push({
          label:
            keyword === 'else'
              ? 'No · condition false'
              : keyword === 'catch'
                ? 'Catch · recover'
                : 'Finally · cleanup',
          start: part.open + 1,
          end: part.end,
          line: part.line,
        });
        end = part.end;
      }
    }
    if (main.keyword === 'if' && branches.length === 1)
      branches.push({
        label: 'No · continue without body',
        start: -1,
        end: -1,
        line: -1,
      });
    const type = ['for', 'while', 'foreach'].includes(main.keyword)
      ? 'loop'
      : main.keyword === 'try'
        ? 'try'
        : main.keyword === 'switch'
          ? 'switch'
          : 'decision';
    if (main.keyword === 'switch') {
      branches.length = 0;
      let depth = 0;
      for (let offset = main.open + 1; offset < main.end; offset++) {
        if (masked[offset] === '{') depth++;
        if (masked[offset] === '}') depth--;
        if (depth || (offset > 0 && /[\w$]/.test(masked[offset - 1]))) continue;
        const label = /^(case\b[^:\n]*|default)\s*:/.exec(
          masked.slice(offset, main.end),
        );
        if (!label) continue;
        if (branches.length) branches.at(-1).end = offset - 1;
        branches.push({
          label: source.slice(offset, offset + label[0].length).trim(),
          start: offset,
          end: main.end,
          line: lines[offset],
        });
        offset += label[0].length - 1;
      }
      if (
        !branches.length ||
        new Set(branches.map((b) => b.line)).size !== branches.length
      )
        continue;
    }
    // ponytail: line-only trace locations cannot separate same-line arms; use prepared order until column evidence exists.
    if (lines[main.open] === lines[end]) continue;
    all.push({
      ...main,
      end,
      endLine: lines[end],
      type,
      branches: branches.map((b) => ({
        ...b,
        endLine: b.end < 0 ? -1 : lines[b.end],
      })),
    });
  }
  return all.sort((a, b) => a.start - b.start || b.end - a.end);
}
const typeOf = (kind) =>
  ({
    branch: 'decision',
    loop: 'loop',
    call: 'call',
    return: 'return',
    console: 'output',
    assign: 'change',
    mutate: 'change',
    transform: 'change',
    throw: 'throw',
    catch: 'catch',
    unresolved: 'unresolved',
  })[kind] ?? 'step';

// Summaries describe supplied evidence, never evaluate a source expression.
export function summarizeVisits(node, events) {
  return (node.iterations ?? []).map((visit) => {
    const prepared = visit.indices
      .map((index) => events[index - 1])
      .filter(Boolean);
    const first = prepared[0];
    const last = prepared.at(-1);
    return {
      index: visit.indices[0],
      label: first?.label ?? visit.label,
      condition:
        typeof first?.values?.condition === 'boolean'
          ? first.values.condition
          : undefined,
      lastOperation: last?.label ?? 'Not supplied',
      changes: visit.indices
        .filter((index) => events[index - 1]?.after !== undefined)
        .map((index) => ({
          index,
          before: events[index - 1].before,
          after: events[index - 1].after,
        })),
    };
  });
}

export function buildSemanticFlow(flow) {
  const events = flow.trace?.events?.length
    ? flow.trace.events
    : (flow.steps ?? []).map((step, i) => ({
        id: `prepared-${i}`,
        kind: 'statement',
        callId: step.from ?? 'flow',
        symbolId: step.from ?? flow.endpoint,
        label: step.dtoName,
        values: step.dtoFields ?? {},
        certainty: 'unresolved',
        stack: [],
        note: 'No trace evidence; prepared order only.',
      }));
  const sources = flow.trace?.sourceFiles ?? {};
  const parsed = new Map(
    Object.entries(sources).map(([file, source]) => [
      file,
      structures(source, file),
    ]),
  );
  const groups = buildMethodGroups(events).invocations;
  const groupMap = new Map(groups.map((group) => [group.callId, group]));
  const calls = new Map(
    groups
      .filter((group) => group.callSiteIndex)
      .map((group) => [group.callSiteIndex, group.callId]),
  );
  const byEvent = new Map(),
    owners = new Map();
  events.forEach((event, i) => {
    const id = event.callId || event.symbolId || 'flow';
    if (!owners.has(id)) owners.set(id, []);
    owners.get(id).push(i + 1);
    byEvent.set(i + 1, id);
  });
  function leaf(index) {
    const event = events[index - 1];
    return {
      id: `event-${index}`,
      type: typeOf(event.kind),
      title: event.label || event.kind,
      indices: [index],
      event,
      ...(calls.has(index) ? { targetId: calls.get(index) } : {}),
      ...(['branch', 'loop'].includes(event.kind)
        ? { note: 'Control structure unavailable; prepared order only.' }
        : {}),
    };
  }
  function groupSequence(indices, candidates) {
    const result = [];
    for (let position = 0; position < indices.length;) {
      const index = indices[position],
        event = events[index - 1];
      const structure = candidates.find(
        (s) =>
          event.source?.line >= s.line &&
          event.source.line <= s.endLine &&
          event.kind !== 'enter',
      );
      if (!structure) {
        result.push(leaf(index));
        position++;
        continue;
      }
      let end = position + 1;
      while (end < indices.length) {
        const next = events[indices[end] - 1];
        if (
          next.source?.file !== event.source.file ||
          next.source.line < structure.line ||
          next.source.line > structure.endLine
        )
          break;
        // A new decision visit belongs to a new evaluation, not the old branch.
        if (
          structure.type === 'decision' &&
          next.kind === 'branch' &&
          next.source.line === structure.line
        )
          break;
        end++;
      }
      const own = indices.slice(position, end);
      const nested = candidates.filter(
        (s) => s.start > structure.start && s.end < structure.end,
      );
      const node = {
        id: `structure-${index}`,
        type: structure.type,
        title: structure.title,
        indices: own,
        event,
      };
      if (structure.type === 'loop') {
        const visits = [];
        for (const step of own) {
          const e = events[step - 1];
          if (
            !visits.length ||
            (e.kind === 'loop' && e.source.line === structure.line)
          )
            visits.push([]);
          visits.at(-1).push(step);
        }
        node.iterations = visits.map((steps, i) => ({
          label: `${i + 1} · ${events[steps[0] - 1].label}`,
          indices: steps,
          children: groupSequence(steps, nested).map((child) =>
            child.type === 'loop' && child.event.source?.line === structure.line
              ? { ...child, type: 'step', note: undefined }
              : child,
          ),
        }));
        node.note =
          'Prepared visits only. Initialization, updates and exit are shown when supplied; no unseen iterations inferred.';
      } else {
        node.branches = structure.branches.map((branch) => ({
          label: branch.label,
          indices: [],
          children: [],
        }));
        const header = [];
        for (const step of own) {
          const e = events[step - 1],
            line = e.source.line;
          // A branch's closing brace may share a line with the next arm header.
          let arm = structure.branches.findLastIndex(
            (b) => b.line >= 0 && line >= b.line && line <= b.endLine,
          );
          if (line === structure.line) {
            header.push(step);
            continue;
          }
          if (arm < 0) {
            header.push(step);
            continue;
          }
          node.branches[arm].indices.push(step);
        }
        for (const [i, branch] of node.branches.entries()) {
          const bounds = structure.branches[i];
          branch.children = groupSequence(
            branch.indices,
            nested.filter(
              (s) => s.start >= bounds.start && s.end <= bounds.end,
            ),
          );
        }
        // Header operations remain inspectable, including their original cursor.
        node.children = header.map((index) => ({
          ...leaf(index),
          type: 'step',
          note: undefined,
        }));
        if (structure.type === 'decision') {
          const condition = event.values?.condition;
          if (typeof condition === 'boolean')
            node.branches.forEach((branch, i) => {
              branch.selected = (i === 0) === condition;
            });
          else
            node.note =
              'Branch outcome not supplied; lanes show source membership, not an inferred condition result.';
        }
      }
      result.push(node);
      position = end;
    }
    return result;
  }
  const methods = [...owners].map(([id, indices]) => {
    const first = events[indices[0] - 1],
      group = groupMap.get(id);
    const files = new Set(
      indices.map((index) => events[index - 1].source?.file),
    );
    const candidates =
      files.size === 1 ? (parsed.get(first.source?.file) ?? []) : [];
    const returned = indices
      .map((index) => events[index - 1])
      .findLast((event) => event.kind === 'return');
    return {
      id,
      symbol: first.symbolId,
      title: first.symbolId,
      source: first.source,
      indices,
      items: groupSequence(indices, candidates),
      inputs: first.inputs,
      result: returned?.result,
      parentId: group?.parentCallId,
    };
  });
  const ids = new Set(methods.map((method) => method.id));
  return {
    methods,
    roots: methods
      .filter((method) => !ids.has(method.parentId))
      .map((method) => method.id),
    byEvent,
  };
}
