import { useEffect, useRef, useCallback } from 'react';
import { useFlowStore } from '../store/flow-store';

/** Manages continuous playback with setTimeout-based tick loop.
 * Replaces the legacy player.js tick() function with React-friendly state.
 * Called by PlaybackControls and App (keyboard shortcuts). */
export function usePlayback() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const versionRef = useRef(0);
  const cursorRef = useRef(0);

  const {
    flow,
    cursor,
    speed,
    setSpeed,
    playbackState,
    setCursor,
    setPlaybackState,
    hasBreakpoint,
    totalSteps,
  } = useFlowStore();

  // Keep ref in sync so tick() reads fresh cursor without stale closure.
  useEffect(() => {
    cursorRef.current = cursor;
  }, [cursor]);

  const tick = useCallback(
    (version: number) => {
      if (version !== versionRef.current) return;
      const steps = totalSteps();
      const current = cursorRef.current;
      if (current >= steps) {
        setPlaybackState('paused');
        return;
      }
      const nextCursor = current + 1;
      setCursor(nextCursor);
      if (hasBreakpoint(nextCursor)) {
        setPlaybackState('paused');
        return;
      }
      if (nextCursor < steps) {
        timerRef.current = setTimeout(() => tick(version), speed);
      } else {
        setPlaybackState('paused');
      }
    },
    [speed, hasBreakpoint, totalSteps, setCursor, setPlaybackState],
  );

  const play = useCallback(() => {
    if (!flow || totalSteps() === 0) return;
    if (playbackState === 'playing') return;
    // Match legacy player.js:2664 — reset to 0 when at end before starting.
    const startCursor = cursorRef.current >= totalSteps() ? 0 : cursorRef.current;
    setCursor(startCursor);
    setPlaybackState('playing');
    const version = ++versionRef.current;
    timerRef.current = setTimeout(() => tick(version), 0);
  }, [flow, playbackState, totalSteps, setCursor, setPlaybackState, tick]);

  const pause = useCallback(() => {
    versionRef.current++;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    setPlaybackState('paused');
  }, [setPlaybackState]);

  const togglePlayPause = useCallback(() => {
    if (playbackState === 'playing') pause();
    else play();
  }, [playbackState, play, pause]);

  const stepForward = useCallback(() => {
    pause();
    const steps = totalSteps();
    if (cursor < steps) setCursor(cursor + 1);
  }, [cursor, totalSteps, pause, setCursor]);

  const stepBackward = useCallback(() => {
    pause();
    if (cursor > 0) setCursor(cursor - 1);
  }, [cursor, pause, setCursor]);

  const restart = useCallback(() => {
    pause();
    setCursor(0);
  }, [pause, setCursor]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return { play, pause, togglePlayPause, stepForward, stepBackward, restart, isPlaying: playbackState === 'playing', speed, setSpeed };
}