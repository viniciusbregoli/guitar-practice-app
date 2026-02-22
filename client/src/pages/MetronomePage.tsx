import { useState } from 'react';
import { useMetronome } from '../hooks/useMetronome';

const PRESET_PATTERNS: { name: string; pattern: boolean[] }[] = [
  { name: '4/4', pattern: [true, false, false, false] },
  { name: '3/4', pattern: [true, false, false] },
  { name: '6/8', pattern: [true, false, false, true, false, false] },
  { name: 'Accent 2&4', pattern: [false, true, false, true] },
  // From the PDF - Routine B accent exercises
  { name: 'PDF #1', pattern: [true, false, false, false, true, false, false, false, true, false, false, false, true, false, true, false] },
  { name: 'PDF #2', pattern: [true, false, false, true, false, true, false, false, true, false, false, true, false, false, true, false] },
];

export function MetronomePage() {
  const metro = useMetronome(80);
  const [activePattern, setActivePattern] = useState(0);

  const handlePatternChange = (idx: number) => {
    setActivePattern(idx);
    metro.setAccentPattern(PRESET_PATTERNS[idx].pattern);
  };

  const beatIndicators = PRESET_PATTERNS[activePattern].pattern;

  return (
    <div className="max-w-2xl mx-auto px-6 pt-8 md:pt-12">
      <h1 className="font-display text-4xl text-amber-400 mb-8 text-center glow-text">
        Metronome
      </h1>

      {/* BPM Display */}
      <div className="relative flex flex-col items-center mb-8">
        <div
          className="text-8xl font-light tracking-tight text-text-primary tabular-nums transition-transform duration-75"
          style={{ transform: metro.isAccent && metro.isPlaying ? 'scale(1.03)' : 'scale(1)' }}
        >
          {metro.bpm}
        </div>
        <span className="text-text-muted text-sm uppercase tracking-widest">BPM</span>
      </div>

      {/* BPM Slider */}
      <div className="mb-6 px-4">
        <input
          type="range"
          min={20}
          max={300}
          value={metro.bpm}
          onChange={e => metro.setBpm(Number(e.target.value))}
          className="w-full h-1 bg-border rounded-full appearance-none cursor-pointer accent-amber-500
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber-500
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,193,7,0.4)]"
        />
        <div className="flex justify-between text-xs text-text-muted mt-1">
          <span>20</span>
          <span>300</span>
        </div>
      </div>

      {/* Quick BPM buttons */}
      <div className="flex gap-2 justify-center mb-8">
        {[-10, -5, -1, 1, 5, 10].map(delta => (
          <button
            key={delta}
            onClick={() => metro.setBpm(metro.bpm + delta)}
            className="px-3 py-1.5 rounded-md bg-surface-raised border border-border text-sm text-text-secondary hover:text-text-primary hover:border-amber-500/30 transition-all"
          >
            {delta > 0 ? `+${delta}` : delta}
          </button>
        ))}
      </div>

      {/* Beat indicators */}
      <div className="flex gap-1.5 justify-center mb-8 flex-wrap max-w-sm mx-auto">
        {beatIndicators.map((isAccent, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all duration-75 ${
              metro.isPlaying && metro.currentBeat === i
                ? isAccent
                  ? 'bg-amber-400 shadow-[0_0_12px_rgba(255,193,7,0.6)] scale-125'
                  : 'bg-text-primary shadow-[0_0_8px_rgba(255,255,255,0.3)] scale-110'
                : isAccent
                  ? 'bg-amber-500/30 border border-amber-500/50'
                  : 'bg-surface-raised border border-border'
            }`}
          />
        ))}
      </div>

      {/* Play / Tap buttons */}
      <div className="flex gap-4 justify-center mb-8">
        <button
          onClick={metro.toggle}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
            metro.isPlaying
              ? 'bg-amber-500 text-void shadow-[0_0_30px_rgba(255,193,7,0.3)] hover:bg-amber-400'
              : 'bg-surface-raised border-2 border-amber-500/40 text-amber-400 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(255,193,7,0.15)]'
          }`}
        >
          {metro.isPlaying ? (
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-8 h-8 ml-1" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 3 20 12 6 21" />
            </svg>
          )}
        </button>

        <button
          onClick={metro.tapTempo}
          className="w-20 h-20 rounded-full bg-surface-raised border-2 border-border text-text-secondary hover:border-text-muted hover:text-text-primary transition-all active:scale-95"
        >
          <span className="text-xs uppercase tracking-wider">Tap</span>
        </button>
      </div>

      {/* Pattern selector */}
      <div className="space-y-2">
        <h3 className="text-xs uppercase tracking-widest text-text-muted text-center mb-3">
          Pattern
        </h3>
        <div className="flex flex-wrap gap-2 justify-center">
          {PRESET_PATTERNS.map((p, i) => (
            <button
              key={i}
              onClick={() => handlePatternChange(i)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                activePattern === i
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
                  : 'bg-surface-raised border border-border text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
