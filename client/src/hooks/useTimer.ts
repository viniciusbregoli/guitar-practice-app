import { useState, useRef, useCallback, useEffect } from 'react';

export function useTimer(durationSeconds: number, onComplete?: () => void) {
  const [remaining, setRemaining] = useState(durationSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const remainingAtPauseRef = useRef(durationSeconds);

  const clear = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    clear();
    setIsRunning(true);
    setIsComplete(false);
    startTimeRef.current = Date.now();
    remainingAtPauseRef.current = remaining;

    intervalRef.current = window.setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const newRemaining = Math.max(0, remainingAtPauseRef.current - elapsed);
      setRemaining(newRemaining);

      if (newRemaining <= 0) {
        clear();
        setIsRunning(false);
        setIsComplete(true);
        onComplete?.();
      }
    }, 100);
  }, [remaining, clear, onComplete]);

  const pause = useCallback(() => {
    clear();
    setIsRunning(false);
    remainingAtPauseRef.current = remaining;
  }, [remaining, clear]);

  const reset = useCallback((newDuration?: number) => {
    clear();
    const d = newDuration ?? durationSeconds;
    setRemaining(d);
    remainingAtPauseRef.current = d;
    setIsRunning(false);
    setIsComplete(false);
  }, [durationSeconds, clear]);

  useEffect(() => {
    return clear;
  }, [clear]);

  const minutes = Math.floor(remaining / 60);
  const seconds = Math.floor(remaining % 60);
  const progress = 1 - remaining / durationSeconds;

  return {
    remaining, minutes, seconds, progress,
    isRunning, isComplete,
    start, pause, reset,
  };
}
