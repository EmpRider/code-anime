import { z } from 'zod';
import { sourceSchema } from '../domain/trace.js';
import type { SceneAppend } from '../domain/scene-input.js';
import { operationSchema } from './animation-builder.js';

// Inspect descriptors before Zod reads values; never copy untrusted keys through setters.
function detachSceneJson(
  value: unknown,
  ancestors = new WeakSet<object>(),
): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean')
    return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'object' || value === null)
    throw new Error('Scene input requires JSON data');
  if (ancestors.has(value))
    throw new Error('Scene input contains cyclic JSON data');
  const isArray = Array.isArray(value);
  const prototype = Object.getPrototypeOf(value);
  if (
    prototype !== (isArray ? Array.prototype : Object.prototype) &&
    prototype !== null
  )
    throw new Error('Scene input requires plain JSON objects and arrays');
  const descriptors = Object.getOwnPropertyDescriptors(value);
  const ownKeys = Reflect.ownKeys(value);
  const result = isArray
    ? []
    : (Object.create(prototype) as Record<string, unknown>);
  ancestors.add(value);
  if (isArray) {
    const length = descriptors.length!.value as number;
    for (const name of ownKeys) {
      if (name === 'length') continue;
      if (
        typeof name !== 'string' ||
        !/^(0|[1-9]\d*)$/.test(name) ||
        Number(name) >= length
      )
        throw new Error('Scene array contains a non-JSON property');
    }
    for (let index = 0; index < length; index++) {
      const descriptor = descriptors[index];
      if (
        !descriptor ||
        !descriptor.enumerable ||
        !Object.hasOwn(descriptor, 'value')
      )
        throw new Error(
          'Scene array requires enumerable data elements, not accessors or holes',
        );
      Object.defineProperty(result, index, {
        value: detachSceneJson(descriptor.value, ancestors),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  } else {
    for (const name of ownKeys) {
      if (typeof name !== 'string')
        throw new Error('Scene input contains a non-JSON property');
      const descriptor = descriptors[name]!;
      if (!descriptor.enumerable || !Object.hasOwn(descriptor, 'value'))
        throw new Error(
          'Scene input requires enumerable data properties, not accessors',
        );
      Object.defineProperty(result, name, {
        value: detachSceneJson(descriptor.value, ancestors),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    }
  }
  ancestors.delete(value);
  return result;
}
function isDictionary(value: unknown): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype ||
      Object.getPrototypeOf(value) === null)
  );
}
// Detachment already checked every nested value; custom dictionaries retain own __proto__ keys.
const dictionary = z.custom<Record<string, unknown>>(isDictionary, {
  message: 'Expected a JSON dictionary',
});
const origins = z.custom<Record<string, string>>(
  (value) =>
    isDictionary(value) &&
    Object.values(value).every((item) => typeof item === 'string'),
  { message: 'origins must map own keys to strings' },
);
const key = z.string().min(1);
const keys = z.array(key);
const order = z.number().int().safe().nonnegative();
const certainty = z.enum([
  'static',
  'mock',
  'assumed',
  'unresolved',
  'proposed',
]);
const source = sourceSchema
  .extend({
    generated: sourceSchema.shape.generated.unwrap().strict().optional(),
  })
  .strict()
  .refine((location) => location.endLine >= location.line, {
    message: 'endLine must not precede line',
    path: ['endLine'],
  });
const common = {
  key,
  label: z.string(),
  certainty,
  evidenceIds: z.array(z.string().uuid()),
};
const node = z
  .object({
    ...common,
    kind: z.enum([
      'entry',
      'statement',
      'decision',
      'branch',
      'loop',
      'iteration',
      'try',
      'catch',
      'finally',
      'switch',
      'case',
      'lambda',
      'call',
      'return',
      'throw',
      'await',
      'yield',
      'console',
      'unresolved',
    ]),
    callKey: key,
    taskId: key,
    order,
    groupPathKeys: keys,
    source: source.nullable(),
    note: z.string().nullable(),
  })
  .strict()
  .refine((value) => value.source !== null || Boolean(value.note?.trim()), {
    message: 'Missing source requires an explicit uncertainty note',
    path: ['note'],
  });
const edge = z
  .object({
    ...common,
    kind: z.enum([
      'sequence',
      'branch-true',
      'branch-false',
      'case',
      'loop-body',
      'loop-back',
      'loop-exit',
      'exception',
      'finally',
      'call',
      'return',
      'await',
      'resume',
      'unresolved',
    ]),
    fromNodeKey: key,
    toNodeKey: key,
    executionStatus: z.enum(['simulated-taken', 'alternative', 'unresolved']),
    callTransition: z
      .object({ fromCallKey: key, toCallKey: key })
      .strict()
      .nullable(),
  })
  .strict();
const group = z
  .object({
    ...common,
    kind: z.enum([
      'decision',
      'branch',
      'loop',
      'iteration',
      'try',
      'catch',
      'finally',
      'switch',
      'case',
      'lambda',
      'sequence',
      'unresolved',
    ]),
    parentGroupKey: key.nullable(),
    memberNodeKeys: keys,
    order,
    callKey: key,
    taskId: key,
    source: source.nullable(),
    arm: z.object({ id: key, label: z.string() }).strict().nullable(),
    iteration: z.number().int().safe().positive().nullable(),
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.arm !== null &&
      value.kind !== 'branch' &&
      value.kind !== 'case'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['arm'],
        message: 'Only branch/case groups may declare an arm',
      });
    }
    if ((value.kind === 'iteration') !== (value.iteration !== null)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['iteration'],
        message: 'Only iteration groups require an iteration index',
      });
    }
  });

// Resolve the existing operation schema on invocation, not during a builder import cycle.
export function parseSceneAppend(raw: unknown): SceneAppend {
  const detached = detachSceneJson(raw);
  const operation = operationSchema
    .omit({ groupPath: true })
    .extend({
      key,
      nodeKey: key,
      callKey: key,
      parentCallKey: key.optional(),
      activeEdgeKeys: keys,
      source: source.optional(),
      inputs: dictionary.optional(),
      set: dictionary.optional(),
      fields: dictionary.optional(),
      values: dictionary.optional(),
      origins: origins.optional(),
    })
    .strict();
  const parsed = z
    .object({
      action: z.literal('append'),
      buildId: z.string().uuid(),
      batchId: z.string().min(1).max(80),
      expectedEventCount: order,
      operations: z.array(operation).min(1).max(100),
      nodes: z.array(node),
      edges: z.array(edge),
      groups: z.array(group),
    })
    .strict()
    .parse(detached);
  return {
    ...parsed,
    operations: parsed.operations.map(({ parentCallKey, ...operation }) => ({
      ...operation,
      ...(parentCallKey === undefined ? {} : { parentCallKey }),
    })),
  };
}
