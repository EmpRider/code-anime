import type { Node, Edge } from '@xyflow/react';
import type { FlowData, ViewMode } from '../types/flow';

/** Converts flow steps into React Flow nodes and edges with dagre-style vertical layout.
 * Called by client/src/components/graph/flow-graph.tsx:29.
 * No existing file serves this purpose — replaces legacy Cytoscape+dagre in public/player.js.
 * User instruction: "re write the FE part with react... dont make sorce file as god object" */
export function layoutNodes(
  flow: FlowData,
  _viewMode: ViewMode,
): { initialNodes: Node[]; initialEdges: Edge[] } {
  const methods = new Set<string>();
  for (const step of flow.steps) {
    methods.add(step.from);
    methods.add(step.to);
  }
  const methodList = Array.from(methods);
  const nodeHeight = 60;
  const nodeWidth = 180;
  const verticalGap = 120;

  const initialNodes: Node[] = methodList.map((method, i) => ({
    id: method,
    type: 'methodNode',
    position: { x: 300, y: i * (nodeHeight + verticalGap) },
    data: { label: method.split('.').pop() ?? method, isActive: false },
    style: { width: nodeWidth, height: nodeHeight },
  }));

  const initialEdges: Edge[] = flow.steps.map((step, i) => ({
    id: `e-${i}`,
    source: step.from,
    target: step.to,
    type: 'dataPacket',
    animated: false,
    data: { packet: null, dtoName: step.dtoName },
    markerEnd: { type: 'arrowclosed' as const, color: '#4a5280' },
    style: { stroke: '#4a5280', strokeWidth: 2 },
  }));

  return { initialNodes, initialEdges };
}