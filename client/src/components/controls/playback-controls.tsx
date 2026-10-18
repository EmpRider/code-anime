import { useFlowStore } from '../../store/flow-store';
import { usePlayback } from '../../hooks/use-playback';
import { useStepping } from '../../hooks/use-stepping';

export function PlaybackControls() {
  const { flow, cursor, setCursor } = useFlowStore();
  const { play, pause, isPlaying, speed, setSpeed } = usePlayback();
  const { stepInto, stepOver, stepOut } = useStepping();

  if (!flow) return null;

  const total = flow.steps.length;
  const atEnd = cursor >= total;

  return (
    <footer className="playback-dock">
      <div className="transport">
        <button
          id="restart"
          className="icon-button"
          title="Restart (Home)"
          aria-label="Restart"
          onClick={() => setCursor(0)}
          disabled={cursor === 0}
        >
          ↺
        </button>
        <button
          id="previous"
          className="icon-button"
          title="Previous step (←)"
          aria-label="Previous step"
          onClick={() => setCursor(Math.max(0, cursor - 1))}
          disabled={cursor === 0}
        >
          ▏◂
        </button>
        <button
          id="play"
          className="play-button"
          onClick={() => (isPlaying ? pause() : play())}
          disabled={total === 0}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
        <button
          id="next"
          className="icon-button"
          title="Next step (→)"
          aria-label="Next step"
          onClick={() => setCursor(Math.min(total, cursor + 1))}
          disabled={atEnd}
        >
          ▸▕
        </button>
        <button
          id="step-into"
          className="icon-button"
          title="Step into method (I)"
          aria-label="Step into method"
          onClick={stepInto}
        >
          ↘
        </button>
        <button
          id="step-over"
          className="icon-button"
          title="Step over method (O)"
          aria-label="Step over method"
          onClick={stepOver}
        >
          ↷
        </button>
        <button
          id="step-out"
          className="icon-button"
          title="Step out of method (U)"
          aria-label="Step out of method"
          onClick={stepOut}
        >
          ⇡
        </button>
      </div>
      <div className="timeline-block">
        <div className="timeline-caption">
          <span id="playback-label">
            {cursor === 0
              ? 'Ready when you are'
              : atEnd
              ? 'Replay complete'
              : `Step ${cursor} of ${total}`}
          </span>
          <output id="progress">{cursor} / {total}</output>
        </div>
        <input
          id="timeline"
          type="range"
          min={0}
          max={total}
          value={cursor}
          onChange={(e) => setCursor(Number(e.target.value))}
          aria-label="Execution step"
        />
      </div>
      <label className="speed-label">
        Speed
        <select
          id="speed"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          <option value={1800}>0.5×</option>
          <option value={900}>1×</option>
          <option value={450}>2×</option>
          <option value={225}>4×</option>
        </select>
      </label>
      <p id="status" role="status" aria-live="polite">
        {cursor === 0
          ? 'Ready when you are'
          : atEnd
          ? 'Replay complete'
          : 'Structural / unverified flow'}
      </p>
      <p
        id="navigation-announcement"
        className="screen-reader-only"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      ></p>
    </footer>
  );
}