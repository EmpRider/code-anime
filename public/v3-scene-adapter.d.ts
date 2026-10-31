import type {
  FlowSceneDocument,
  ReadyVariant,
  UnavailableVariant,
  VariantId,
} from '../src/domain/flow-scene.js';

export function validateFlowSceneDocument(raw: unknown): FlowSceneDocument;
export function selectReadyVariant(
  document: FlowSceneDocument,
  variantId: VariantId,
): ReadyVariant | UnavailableVariant | null;
