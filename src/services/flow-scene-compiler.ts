import { preparePlainTerminalOutput } from '../../public/terminal-text.js';
import {
  validateSceneDocument,
  type ReadyVariant,
  type SceneNode,
  type SourceRange,
} from '../domain/flow-scene.js';
import type { AcceptedSceneInput } from '../domain/scene-input.js';
import { compileNavigation } from './flow-scene-navigation.js';
import { prepareSceneSource } from './flow-scene-source.js';

type Playback = ReadyVariant['playback'];
type Invocation = Playback['invocations'][number];
type Visit = Playback['sourceVisits'][number];

function invalid(detail: string): never {
  throw Object.assign(new Error(`Cannot compile V3 scene: ${detail}`), {
    name: 'InvalidArtifactError',
    code: 'INVALID_ARTIFACT',
  });
}

/** Compile accepted, fully prepared mock state; never execute or replay source. */
export function compileReadyVariant(
  input: AcceptedSceneInput,
  signal: AbortSignal,
): ReadyVariant {
  signal.throwIfAborted();
  const files = new Map<string, string>();
  for (const file of input.sources) {
    signal.throwIfAborted();
    if (files.has(file.path))
      invalid(`ambiguous captured source path ${file.path}`);
    files.set(file.path, file.id);
  }
  const requireFile = (path: string): string => {
    const id = files.get(path);
    if (id === undefined) invalid(`source was not captured: ${path}`);
    return id;
  };
  const owners = new Map<string, SceneNode>();
  for (const node of input.graph.nodes) {
    signal.throwIfAborted();
    for (const eventId of node.eventIds) {
      if (owners.has(eventId)) invalid(`duplicate event ownership: ${eventId}`);
      owners.set(eventId, node);
    }
  }

  const invocations = new Map<string, Invocation>();
  for (const [index, event] of input.events.entries()) {
    signal.throwIfAborted();
    const existing = invocations.get(event.callId);
    if (existing !== undefined) {
      existing.stepIds.push(index + 1);
    } else {
      const parent =
        event.parentCallId ??
        (event.stack.at(-1) === event.callId
          ? event.stack.at(-2)
          : event.stack.at(-1));
      invocations.set(event.callId, {
        callId: event.callId,
        symbolId: event.symbolId,
        parentCallId: parent ?? null,
        entryStep: index + 1,
        stepIds: [index + 1],
      });
    }
  }

  const source = prepareSceneSource(input.sources);
  signal.throwIfAborted();
  const displayOutput = preparePlainTerminalOutput(input.events);
  const navigationByCursor = compileNavigation(input.events);
  signal.throwIfAborted();
  const frames: Playback['frames'] = [];
  // JSON validity and own-key-safe detachment are owned by CA028 below. Unknown
  // values are not asserted to be JsonValue before that boundary has checked them.
  const valueSnapshots: Array<{
    id: string;
    variables: unknown;
    objects: unknown;
    result?: unknown;
  }> = [{ id: 'values:0', variables: {}, objects: {} }];
  const stackSnapshots: Playback['stackSnapshots'] = [
    { id: 'stack:0', frames: [] },
  ];
  const consoleEntries: Playback['consoleEntries'] = [];
  const visits = new Map<string, Visit>();

  for (const [index, event] of input.events.entries()) {
    signal.throwIfAborted();
    const step = index + 1;
    const owner = owners.get(event.id);
    if (owner === undefined)
      invalid(`event has no canonical node: ${event.id}`);
    const activeEdges = input.activeEdgeIdsByEventId.get(event.id);
    if (activeEdges === undefined)
      invalid(`event has no prepared edge mapping: ${event.id}`);
    if (event.locals === undefined || event.objects === undefined) {
      invalid(
        `event lacks full prepared Values/objects snapshots: ${event.id}`,
      );
    }

    let sourceRef: SourceRange | null = null;
    if (event.source !== undefined) {
      sourceRef = {
        fileId: requireFile(event.source.file),
        line: event.source.line,
        endLine: event.source.endLine,
        ...(event.source.generated === undefined
          ? {}
          : {
              generated: {
                fileId: requireFile(event.source.generated.file),
                line: event.source.generated.line,
              },
            }),
      };
      // Visits are chronological occurrences of the starting line. A frame
      // retains its complete range separately; do not invent extra line visits.
      const key = JSON.stringify([
        sourceRef.fileId,
        sourceRef.line,
        event.callId,
      ]);
      const visit = visits.get(key);
      if (visit !== undefined) visit.stepIds.push(step);
      else
        visits.set(key, {
          fileId: sourceRef.fileId,
          line: sourceRef.line,
          callId: event.callId,
          stepIds: [step],
        });
    }

    const valueSnapshotId = `values:${step}`;
    const stackSnapshotId = `stack:${step}`;
    valueSnapshots.push({
      id: valueSnapshotId,
      variables: event.locals,
      objects: event.objects,
      ...(Object.hasOwn(event, 'result') ? { result: event.result } : {}),
    });
    stackSnapshots.push({
      id: stackSnapshotId,
      frames: event.stack.map((callId) => {
        const invocation = invocations.get(callId);
        if (invocation === undefined)
          invalid(`stack references unknown invocation: ${callId}`);
        return { callId, label: invocation.symbolId };
      }),
    });
    if (event.kind === 'console' && event.output !== undefined) {
      const text = displayOutput[index];
      if (text === undefined)
        invalid(`console has no prepared display output: ${event.id}`);
      consoleEntries.push({
        id: `console:${consoleEntries.length + 1}`,
        text,
        certainty: event.certainty,
        sourceStep: step,
      });
    }
    frames.push({
      id: `frame:${step}`,
      eventId: event.id,
      step,
      activeNodeIds: [owner.id],
      activeEdgeIds: [...activeEdges],
      callId: event.callId,
      taskId: event.taskId ?? 'main',
      sourceRef,
      valueSnapshotId,
      stackSnapshotId,
      consoleThrough: consoleEntries.length,
    });
  }

  signal.throwIfAborted();
  // Reuse the canonical validator, including deep detachment/freeze of every
  // nested own key. Never return the temporary input-sharing construction data.
  const document = validateSceneDocument({
    schemaVersion: '3.0.0',
    comparison: { defaultVariantId: 'proposed', variantOrder: ['proposed'] },
    variantsById: {
      proposed: {
        availability: 'ready',
        artifact: input.artifact,
        scenario: input.scenario,
        provenance: input.provenance,
        status: input.status,
        graph: input.graph,
        source,
        playback: {
          initial: {
            valueSnapshotId: 'values:0',
            stackSnapshotId: 'stack:0',
            consoleThrough: 0,
          },
          frames,
          navigationByCursor,
          valueSnapshots,
          stackSnapshots,
          consoleEntries,
          sourceVisits: [...visits.values()],
          invocations: [...invocations.values()],
        },
      },
    },
  });
  signal.throwIfAborted();
  return document.variantsById.proposed;
}
