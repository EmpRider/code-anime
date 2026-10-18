import { useState } from 'react';
import { useFlowStore } from '../../store/flow-store';

type Tab = 'Fields' | 'Locals' | 'Objects';

export function Inspector() {
  const { flow, cursor } = useFlowStore();
  const [activeTab, setActiveTab] = useState<Tab>('Fields');
  if (!flow) return null;

  const event = flow.trace?.events?.[cursor - 1];
  const step = flow.steps[cursor - 1];
  const locals = event?.locals;
  const objects = event?.objects;

  return (
    <div className="panel inspector">
      <div className="panel-heading">
        <h2>Inspector</h2>
        <span className="kind-badge">{event?.kind ?? 'READY'}</span>
      </div>
      <div className="inspector-summary">
        <div className="eyebrow">
          {cursor ? `STEP ${String(cursor).padStart(2, '0')}` : 'NO STEP SELECTED'}
        </div>
        <h3>{event?.label ?? step?.dtoName ?? 'Ready to explore'}</h3>
        <div id="route">
          {step ? `${step.from} → ${step.to}` : 'Explore a simulated code flow'}
        </div>
        <div id="certainty">
          {event
            ? [event.certainty, event.note].filter(Boolean).join(' · ')
            : flow.trace?.simulation
              ? 'Mock execution · local session'
              : 'Structural / unverified flow'}
        </div>
      </div>
      <div className="tabs">
        {(['Fields', 'Locals', 'Objects'] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div className="inspector-content">
        {activeTab === 'Fields' && (
          <>
            <div className="section-caption">
              <span>DTO FIELDS</span>
              <label>
                <input type="checkbox" id="changes-only" />
                Changes only
              </label>
            </div>
            <div id="fields">
              {!cursor && (
                <div className="empty-message">Select a step to inspect its fields</div>
              )}
              {(event?.after ?? step?.dtoFields) && typeof (event?.after ?? step?.dtoFields) === 'object' &&
                Object.entries((event?.after ?? step?.dtoFields) as Record<string, unknown>).map(([key, value]) => (
                  <div key={key} className="field">
                    <span style={{ color: '#a4acc7' }}>{key}: </span>
                    {JSON.stringify(value)}
                  </div>
                ))}
            </div>
          </>
        )}
        {activeTab === 'Locals' && (
          <div id="locals">
            {!cursor && <div className="empty-message">Select a step to inspect locals</div>}
            {locals && Object.entries(locals).map(([key, value]) => (
              <div key={key} className="field">
                <span style={{ color: '#a4acc7' }}>{key}: </span>
                {JSON.stringify(value)}
              </div>
            ))}
            {cursor && !locals && <div className="empty-message">No locals captured for this step</div>}
          </div>
        )}
        {activeTab === 'Objects' && (
          <div id="objects">
            {!cursor && <div className="empty-message">Select a step to inspect objects</div>}
            {objects && Object.entries(objects).map(([key, value]) => (
              <div key={key} className="field">
                <span style={{ color: '#a4acc7' }}>{key}: </span>
                {JSON.stringify(value)}
              </div>
            ))}
            {cursor && !objects && <div className="empty-message">No objects captured for this step</div>}
          </div>
        )}
      </div>
    </div>
  );
}