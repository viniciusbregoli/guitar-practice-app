import { useState, useEffect, useRef, useCallback } from 'react';
import { MetronomeEngine } from '../services/audio/MetronomeEngine';
import type { MetronomeSound } from '../services/audio/MetronomeEngine';

export function useMetronome(initialBpm = 80) {
  const engineRef = useRef<MetronomeEngine | null>(null);
  const [bpm, setBpm] = useState(initialBpm);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isAccent, setIsAccent] = useState(false);
  const tapTimesRef = useRef<number[]>([]);

  useEffect(() => {
    const engine = new MetronomeEngine();
    engine.setOnBeat((beat, accent) => {
      setCurrentBeat(beat);
      setIsAccent(accent);
    });
    engineRef.current = engine;
    return () => engine.destroy();
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.bpm = bpm;
    }
  }, [bpm]);

  const toggle = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.toggle();
    setIsPlaying(engine.playing);
  }, []);

  const start = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    await engine.start();
    setIsPlaying(true);
  }, []);

  const stop = useCallback(() => {
    engineRef.current?.stop();
    setIsPlaying(false);
    setCurrentBeat(0);
  }, []);

  const tapTempo = useCallback(() => {
    const now = performance.now();
    const taps = tapTimesRef.current;
    taps.push(now);

    // Keep last 5 taps
    if (taps.length > 5) taps.shift();
    if (taps.length < 2) return;

    const intervals = [];
    for (let i = 1; i < taps.length; i++) {
      intervals.push(taps[i] - taps[i - 1]);
    }

    // Reset if gap > 2 seconds
    if (intervals[intervals.length - 1] > 2000) {
      tapTimesRef.current = [now];
      return;
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const newBpm = Math.round(60000 / avgInterval);
    setBpm(Math.max(20, Math.min(300, newBpm)));
  }, []);

  const setAccentPattern = useCallback((pattern: boolean[]) => {
    engineRef.current?.setAccentPattern(pattern);
  }, []);

  const setSound = useCallback((sound: MetronomeSound) => {
    engineRef.current?.setSound(sound);
  }, []);

  return {
    bpm, setBpm,
    isPlaying, currentBeat, isAccent,
    toggle, start, stop,
    tapTempo, setAccentPattern, setSound,
  };
}
