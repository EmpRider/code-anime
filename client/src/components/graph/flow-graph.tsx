import { useMemo, useEffect, forwardRef, useImperativeHandle } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useFlowStore } from '../../store/flow-store';
import { MethodNode } from './nodes/method-node';
import { DataPacketEdge } from './edges/data-packet-edge';
import { layoutNodes } from '../../utils/layout';

const nodeTypes = { methodNode: MethodNode };
const edgeTypes = { dataPacket: DataPacketEdge };

export interface FlowGraphHandle {
  fitView: () => void;
}

/** Renders the interactive flow graph using React Flow.
 * Replaces the legacy Cytoscape.js implementation.
 * Read by src/App.tsx as the main visualization panel. */
export const FlowGraph = forwardRef<FlowGraphHandle>(function FlowGraph(_props, ref) {
  return (
    <ReactFlowProvider>
      <FlowGraphInner ref={ref} />
    </ReactFlowProvider>
  );
});

const FlowGraphInner = forwardRef<FlowGraphHandle>(function FlowGraphInner(_props, ref) {
  const { flow, cursor, viewMode, followActive } = useFlowStore();
  const reactFlow = useReactFlow();

  useImperativeHandle(ref, () => ({
    fitView: () => reactFlow.fitView({ duration: 200 }),
  }));

  // Auto-scroll to active node when follow is enabled
  useEffect(() => {
    if (!followActive || !flow || cursor < 1 || cursor > flow.steps.length) return;
    const step = flow.steps[cursor - 1];
    const nodeId = step?.from || step?.to;
    const node = nodeId ? reactFlow.getNode(nodeId) : undefined;
    if (node?.position) {
      const x = node.position.x + (node.width ?? 0) / 2;
      const y = node.position.y + (node.height ?? 0) / 2;
      reactFlow.setCenter(x, y, { zoom: reactFlow.getZoom(), duration: 200 });
    }
  }, [cursor, followActive, flow, reactFlow]);

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!flow) return { initialNodes: [] as Node[], initialEdges: [] as Edge[] };
    return layoutNodes(flow, viewMode);
  }, [flow, viewMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync nodes/edges when layout changes (flow or viewMode)
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Update active states based on cursor
  useEffect(() => {
    if (!flow) return;
    const activeStep = cursor >= 1 && cursor <= flow.steps.length
      ? flow.steps[cursor - 1]
      : null;

    setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isActive: activeStep
            ? node.id === activeStep.from || node.id === activeStep.to
            : false,
        },
      })),
    );

    setEdges((eds) =>
      eds.map((edge) => ({
        ...edge,
        animated: activeStep
          ? edge.source === activeStep.from && edge.target === activeStep.to
          : false,
        data: {
          ...edge.data,
          packet:
            activeStep &&
            edge.source === activeStep.from &&
            edge.target === activeStep.to
              ? { name: activeStep.dtoName, fields: activeStep.dtoFields }
              : null,
        },
      })),
    );
  }, [cursor, flow, setNodes, setEdges]);

  if (!flow) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        Loading flow...
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        attributionPosition="bottom-left"
        className="bg-bg"
      >
        <Background color="#262b3b" gap={20} />
        <Controls className="!bg-panel !border-border" />
        <MiniMap
          nodeColor={(node) => (node.data?.isActive ? '#aa95ff' : '#4a5280')}
          maskColor="rgba(12, 14, 20, 0.8)"
          className="!bg-panel !border-border"
        />
      </ReactFlow>
    </div>
  );
});