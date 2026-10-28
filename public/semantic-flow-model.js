import { buildMethodGroups } from './flow-overview.js';

// Only brace-delimited structures with unambiguous line ranges are grouped.
// Unsupported syntax stays in prepared order; source expressions are never run.
// Mask comments and literals without changing source positions or line numbers.
// If the lexical evidence is damaged, do not claim a source-proven structure.
function maskSource(source) {
  const output = source.split('');
  let state = 'code';
  const hide = (index) => {
    if (source[index] !== '\n') output[index] = ' ';
  };
  for (let i = 0; i < source.length; i++) {
    const character = source[i];
    const next = source[i + 1];
    if (state === 'code') {
      if (character === '/' && next === '/') {
        hide(i);
        hide(++i);
        state = 'line';
      } else if (character === '/' && next === '*') {
        hide(i);
        hide(++i);
        state = 'comment';
      } else if (source.slice(i, i + 3) === '"""') {
        hide(i);
        hide(++i);
        hide(++i);
        state = 'triple';
      } else if (character === '"' || character === "'" || character === '\`') {
        hide(i);
        state = character;
      }
    } else if (state === 'line') {
      if (character === '\n') state = 'code';
      else hide(i);
    } else if (state === 'comment') {
      hide(i);
      if (character === '*' && next === '/') {
        hide(++i);
        state = 'code';
      }
    } else if (state === 'triple') {
      hide(i);
      if (source.slice(i, i + 3) === '"""') {
        hide(++i);
        hide(++i);
        state = 'code';
      }
    } else {
      if (character === '\n' && state !== '\`') return;
      hide(i);
      if (character === '\\' && next !== undefined) hide(++i);
      else if (character === state) state = 'code';
    }
  }
  return state === 'code' || state === 'line' ? output.join('') : undefined;
}

// Group only brace-delimited source-proven regions. Unknown syntax remains
// inspectable as prepared events; no expressions are evaluated.
function structures(source, file) {
  if (
    typeof source !== 'string' ||
    !/\.(?:[cm]?[jt]sx?|java|cs|kt|c|cpp|h|go|rs)$/.test(file)
  )
    return [];
  const masked = maskSource(source);
  if (masked === undefined) return [];
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
  const classBodies = new Set();
  for (const match of masked.matchAll(/\bclass\b/g)) {
    const open = masked.indexOf('{', match.index + match[0].length);
    if (
      open >= 0 &&
      pairs.has(open) &&
      !/[;{}]/.test(masked.slice(match.index + match[0].length, open))
    )
      classBodies.add(open);
  }
  const objectBodies = new Set();
  for (const [open] of pairs) {
    if (masked[open] !== '{' || classBodies.has(open)) continue;
    let before = open - 1;
    while (before >= 0 && /\s/.test(masked[before])) before--;
    const character = masked[before];
    const suffix = masked.slice(Math.max(0, before - 160), before + 1);
    const isCaseBlock =
      character === ':' && /\b(?:case\s+[^:;{}]*|default)\s*:$/.test(suffix);
    if (
      !isCaseBlock &&
      ((character === '=' && masked[before - 1] !== '>') ||
        character === ':' ||
        character === '(' ||
        /\b(?:return|default)$/.test(suffix))
    )
      objectBodies.add(open);
  }
  const braceScopes = [...pairs]
    .filter(([open]) => masked[open] === '{')
    .sort(([a], [b]) => a - b);
  const activeScopes = [];
  let scopeCursor = 0;
  const directlyInsideDeclaration = (offset) => {
    while (
      scopeCursor < braceScopes.length &&
      braceScopes[scopeCursor][0] < offset
    ) {
      const [open, close] = braceScopes[scopeCursor++];
      while (activeScopes.length && activeScopes.at(-1)[1] < open)
        activeScopes.pop();
      activeScopes.push([open, close]);
    }
    while (activeScopes.length && activeScopes.at(-1)[1] <= offset)
      activeScopes.pop();
    const enclosing = activeScopes.at(-1)?.[0];
    return classBodies.has(enclosing) || objectBodies.has(enclosing);
  };
  const skip = (offset) => {
    while (offset < masked.length && /\s/.test(masked[offset])) offset++;
    return offset;
  };
  function block(start, keyword) {
    let open = skip(start + keyword.length);
    if (
      keyword === 'try' &&
      masked[open] !== '{' &&
      !(file.endsWith('.java') && masked[open] === '(')
    )
      return;
    if (
      ['if', 'for', 'while', 'foreach', 'switch'].includes(keyword) &&
      masked[open] !== '('
    )
      return;
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
  function ifTail(main) {
    const next = skip(main.end + 1);
    if (!/^else\b/.test(masked.slice(next))) return { end: main.end };
    const after = skip(next + 4);
    if (!/^if\b/.test(masked.slice(after))) {
      const alternative = block(next, 'else');
      if (!alternative) return;
      return {
        end: alternative.end,
        alternative: {
          label: 'No · condition false',
          start: alternative.open + 1,
          end: alternative.end,
          line: alternative.line,
        },
      };
    }
    const nestedStart = after;
    let current = block(after, 'if');
    if (!current) return;
    let end = current.end;
    while (true) {
      const nextElse = skip(end + 1);
      if (!/^else\b/.test(masked.slice(nextElse))) break;
      const following = skip(nextElse + 4);
      if (/^if\b/.test(masked.slice(following))) {
        current = block(following, 'if');
        if (!current) return;
        end = current.end;
      } else {
        const finalElse = block(nextElse, 'else');
        if (!finalElse) return;
        end = finalElse.end;
        break;
      }
    }
    return {
      end,
      alternative: {
        label: 'No · condition false',
        start: nestedStart,
        end,
        line: lines[nestedStart],
      },
    };
  }
  const all = [];
  for (const match of masked.matchAll(
    /\b(if|for|while|foreach|try|switch)\b/g,
  )) {
    if (directlyInsideDeclaration(match.index)) continue;
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
    if (main.keyword === 'if') {
      const tail = ifTail(main);
      if (!tail) continue;
      if (tail.alternative) branches.push(tail.alternative);
      end = tail.end;
    } else if (main.keyword === 'try') {
      while (true) {
        const next = skip(end + 1);
        const keyword = /^(else|catch|finally)\b/.exec(masked.slice(next))?.[1];
        if (!keyword || keyword === 'else') break;
        const part = block(next, keyword);
        if (!part) break;
        branches.push({
          label: keyword === 'catch' ? 'Catch · recover' : 'Finally · cleanup',
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
    // Line-only traces cannot disambiguate same-line arms.
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
  const suppliedSources = flow.trace?.sourceFiles;
  const sources =
    suppliedSources && typeof suppliedSources === 'object'
      ? suppliedSources
      : {};
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
  const taskContexts = new Map();
  const entryCounts = new Map();
  const occurrences = new Map();
  const occurrenceByIndex = events.map((event) => {
    const key = JSON.stringify([
      event.callId ?? event.symbolId ?? 'flow',
      event.id ?? null,
      event.kind,
    ]);
    const count = occurrences.get(key) ?? 0;
    occurrences.set(key, count + 1);
    return count;
  });
  events.forEach((event, i) => {
    const id = event.callId || event.symbolId || 'flow';
    if (!owners.has(id)) owners.set(id, []);
    owners.get(id).push(i + 1);
    byEvent.set(i + 1, id);
    const task = event.values?.task ?? event.values?.taskId ?? event.taskId;
    const thread = event.values?.thread ?? event.thread;
    if (!taskContexts.has(id)) taskContexts.set(id, new Set());
    taskContexts.get(id).add(JSON.stringify([task ?? null, thread ?? null]));
    if (event.kind === 'enter')
      entryCounts.set(id, (entryCounts.get(id) ?? 0) + 1);
  });
  const ambiguousTasks = new Set(
    [...taskContexts]
      .filter(
        ([id, contexts]) => contexts.size > 1 || (entryCounts.get(id) ?? 0) > 1,
      )
      .map(([id]) => id),
  );
  function evidence(index) {
    const event = events[index - 1];
    const invocationId = event.callId ?? event.symbolId ?? 'flow';
    const eventId = event.id ?? null;
    const occurrence = occurrenceByIndex[index - 1];
    return {
      eventId,
      invocationId,
      visitIdentity: JSON.stringify([
        invocationId,
        eventId,
        event.kind,
        occurrence,
      ]),
      evidenceIdentity: JSON.stringify([
        index,
        invocationId,
        eventId,
        occurrence,
      ]),
    };
  }
  function leaf(index) {
    const event = events[index - 1];
    const unresolved = event.kind === 'branch' || event.kind === 'loop';
    return {
      id: `event-${index}`,
      type: unresolved ? 'unresolved' : typeOf(event.kind),
      title: event.label || event.kind,
      indices: [index],
      event,
      ...evidence(index),
      ...(unresolved ? { ownershipStatus: 'unresolved' } : {}),
      ...(calls.has(index) ? { targetId: calls.get(index) } : {}),
      ...(unresolved
        ? { note: 'Unresolved source ownership; prepared order only.' }
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
          event.kind !== 'enter' &&
          (s.type !== 'decision' ||
            (event.kind === 'branch' && event.source.line === s.line)) &&
          (s.type !== 'loop' ||
            (event.kind === 'loop' && event.source.line === s.line)),
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
        (s) => s.start > structure.start && s.end <= structure.end,
      );
      const node = {
        id: `structure-${index}`,
        type: structure.type,
        title: structure.title,
        indices: own,
        event,
        ...evidence(index),
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
            child.event.kind === 'loop' &&
            child.event.source?.line === structure.line
              ? {
                  ...child,
                  type: 'step',
                  note: undefined,
                  ownershipStatus: 'source-proven',
                }
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
        const header = [],
          unknown = [];
        for (const step of own) {
          const e = events[step - 1],
            line = e.source.line;
          const armMatches = structure.branches.flatMap((b, i) =>
            b.line >= 0 && line >= b.line && line <= b.endLine ? [i] : [],
          );
          let arm = armMatches.at(-1) ?? -1;
          if (armMatches.length > 1) {
            if (e.kind === 'catch') arm = armMatches.find((i) => i > 0) ?? -1;
            else {
              unknown.push(step);
              continue;
            }
          }
          if (line === structure.line || arm < 0) {
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
        node.children = [
          ...header.map((index) => ({
            ...leaf(index),
            type: 'step',
            note: undefined,
          })),
          ...unknown.map((index) => ({
            ...leaf(index),
            type: 'unresolved',
            ownershipStatus: 'unresolved',
            note: 'Unresolved shared-line branch ownership; prepared event only.',
          })),
        ].sort((a, b) => a.indices[0] - b.indices[0]);
        if (structure.type === 'decision') {
          const condition = event.values?.condition;
          if (typeof condition === 'boolean' && node.branches.length === 2) {
            const conflicts = node.branches.some(
              (branch, i) =>
                (i === 0) !== condition && branch.indices.length > 0,
            );
            if (conflicts) {
              node.ownershipStatus = 'unresolved';
              node.note =
                'Contradictory evidence: prepared source membership conflicts with the supplied branch outcome; no arm selected.';
            } else
              node.branches.forEach((branch, i) => {
                branch.selected = (i === 0) === condition;
              });
          } else
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
      files.size === 1 && !ambiguousTasks.has(id)
        ? (parsed.get(first.source?.file) ?? [])
        : [];
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
      ...(ambiguousTasks.has(id)
        ? {
            note: 'Unresolved invocation ownership: conflicting or incomplete task/entry identity for one callId; prepared order only.',
          }
        : {}),
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
