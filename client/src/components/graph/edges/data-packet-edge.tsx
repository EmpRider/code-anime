import { memo, useMemo, useEffect } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';

interface PacketData {
  name: string;
  fields: Record<string, unknown>;
}

/** Custom React Flow edge with animated data packet matching legacy .packet CSS exactly.
 * Legacy spec: position absolute, width 180px, padding 6px 8px, border 1px solid rgba(168,139,250,0.4),
 * border-radius 7px, background linear-gradient(145deg, #2a2542, #1c2030), color #ede9fe,
 * box-shadow 0 4px 12px rgba(0,0,0,0.3) + 0 0 12px rgba(139,92,246,0.1),
 * animation packet-appear 0.25s cubic-bezier(0.34,1.56,0.64,1).
 * Called by client/src/components/graph/flow-graph.tsx:19 (edgeTypes.dataPacket). */
export const DataPacketEdge = memo(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    data,
    animated,
    style,
    markerEnd,
  }: EdgeProps) => {
    const [edgePath] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });

    const packet = data?.packet as PacketData | null;
    const progress = useMotionValue(0);

    // Interpolate along straight line between endpoints
    // ponytail: bezier-accurate path following requires getPointAtLength; upgrade when curves cause visible drift
    const packetX = useTransform(progress, [0, 1], [sourceX, targetX]);
    const packetY = useTransform(progress, [0, 1], [sourceY, targetY]);

    useEffect(() => {
      if (animated && packet) {
        progress.set(0);
        animate(progress, 1, { duration: 0.8, ease: 'easeInOut' });
      } else {
        progress.set(0);
      }
    }, [animated, packet, progress]);

    const fieldEntries = useMemo(() => {
      if (!packet?.fields) return [];
      return Object.entries(packet.fields).slice(0, 3);
    }, [packet]);

    return (
      <>
        <BaseEdge
          id={id}
          path={edgePath}
          markerEnd={markerEnd}
          style={{
            ...style,
            stroke: animated ? '#aa95ff' : '#4a5280',
            strokeWidth: animated ? 3 : 2,
            strokeDasharray: animated ? '8 4' : undefined,
          }}
        />
        {packet && (
          <EdgeLabelRenderer>
            <motion.div
              style={{
                position: 'absolute',
                x: packetX,
                y: packetY,
                translateX: '-50%',
                translateY: '-50%',
                width: '180px',
                maxWidth: 'calc(100% - 24px)',
                padding: '6px 8px',
                border: '1px solid rgba(168, 139, 250, 0.4)',
                borderRadius: '7px',
                background: 'linear-gradient(145deg, #2a2542, #1c2030)',
                color: '#ede9fe',
                zIndex: 2,
                boxShadow:
                  '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 12px rgba(139, 92, 246, 0.1)',
                minHeight: '40px',
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.25, ease: [0.34, 1.56, 0.64, 1] }}
            >
              <div
                style={{
                  display: 'block',
                  fontSize: '11px',
                  fontWeight: 600,
                  lineHeight: 1.4,
                  marginBottom: '6px',
                  color: '#c4b5fd',
                  overflowWrap: 'anywhere',
                  letterSpacing: '0.2px',
                }}
              >
                {packet.name}
              </div>
              {fieldEntries.map(([key, value]) => (
                <div
                  key={key}
                  style={{
                    margin: '2px 0',
                    padding: '3px 6px',
                    fontSize: '9px',
                    lineHeight: 1.3,
                    color: '#c4b5fd',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    borderRadius: '4px',
                    fontFamily: 'Consolas, monospace',
                  }}
                >
                  <span style={{ color: '#a7a4c3' }}>{key}:</span>{' '}
                  {String(value).slice(0, 20)}
                </div>
              ))}
            </motion.div>
          </EdgeLabelRenderer>
        )}
      </>
    );
  },
);
DataPacketEdge.displayName = 'DataPacketEdge';