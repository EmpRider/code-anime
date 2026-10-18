import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

/** Custom React Flow node matching legacy .node CSS exactly.
 * Legacy spec: background: linear-gradient(145deg, #202638, #171c29),
 * border: 1px solid #39435b, border-radius: 9px, padding: 12px 14px,
 * SYMBOL caption + monospace method name. Active state adds accent border + glow. */
export const MethodNode = memo(({ data }: NodeProps) => {
  const isActive = data?.isActive as boolean;
  const label = (data?.label as string) ?? '';
  const symbol = (data?.symbol as string) ?? 'SYMBOL';

  return (
    <div
      className="node"
      style={{
        background: 'linear-gradient(145deg, #202638, #171c29)',
        border: isActive ? '1px solid #aa95ff' : '1px solid #39435b',
        borderRadius: '9px',
        padding: '12px 14px',
        minWidth: '140px',
        textAlign: 'center',
        boxShadow: isActive ? '0 0 18px rgba(170,149,255,0.25)' : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-[#39435b] !w-2 !h-2" />
      <div
        style={{
          fontSize: '9px',
          letterSpacing: '1.4px',
          color: '#6f7a96',
          fontWeight: 700,
          marginBottom: '4px',
          textTransform: 'uppercase',
        }}
      >
        {symbol}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontSize: '12px',
          color: isActive ? '#e2daf8' : '#c3cadb',
          fontWeight: 500,
        }}
      >
        {label}
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-[#39435b] !w-2 !h-2" />
    </div>
  );
});
MethodNode.displayName = 'MethodNode';