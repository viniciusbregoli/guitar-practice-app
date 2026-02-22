import { useState } from 'react';
import {
  NOTES, STANDARD_TUNING, TUNING_NOTES, NUM_FRETS,
  SCALE_PATTERNS, INTERVAL_NAMES,
  getNoteAtFret, getScaleNotes, getInterval,
  type NoteName,
} from '../../utils/scales';

interface FretboardProps {
  root?: NoteName;
  scalePattern?: string;
  showIntervals?: boolean;
  className?: string;
}

export function Fretboard({
  root: initialRoot,
  scalePattern: initialPattern,
  showIntervals: initialShowIntervals,
  className = '',
}: FretboardProps) {
  const [root, setRoot] = useState<NoteName>(initialRoot ?? 'A');
  const [scalePattern, setScalePattern] = useState(initialPattern ?? 'Minor Pentatonic');
  const [showIntervals, setShowIntervals] = useState(initialShowIntervals ?? false);

  const pattern = SCALE_PATTERNS[scalePattern] ?? SCALE_PATTERNS['Minor Pentatonic'];
  const scaleNotes = getScaleNotes(root, pattern);

  const fretWidth = (fret: number) => {
    // Frets get narrower as you go up - approximate guitar proportions
    const base = 60;
    return Math.max(28, base * Math.pow(0.944, fret));
  };

  const totalWidth = Array.from({ length: NUM_FRETS + 1 }, (_, i) => fretWidth(i)).reduce((a, b) => a + b, 0);

  const dotFrets = [3, 5, 7, 9, 12, 15, 17, 19, 21];
  const doubleDotFrets = [12];

  return (
    <div className={className}>
      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <select
          value={root}
          onChange={e => setRoot(e.target.value as NoteName)}
          className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
        >
          {NOTES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={scalePattern}
          onChange={e => setScalePattern(e.target.value)}
          className="bg-surface-raised border border-border rounded-lg px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:border-amber-500/50"
        >
          {Object.keys(SCALE_PATTERNS).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <button
          onClick={() => setShowIntervals(!showIntervals)}
          className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
            showIntervals
              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40'
              : 'bg-surface-raised border border-border text-text-muted hover:text-text-primary'
          }`}
        >
          {showIntervals ? 'Intervals' : 'Notes'}
        </button>
      </div>

      {/* Fretboard SVG */}
      <div className="overflow-x-auto pb-2 -mx-4 px-4">
        <svg
          viewBox={`0 0 ${totalWidth + 40} 140`}
          className="w-full min-w-[700px]"
          style={{ maxHeight: '220px' }}
        >
          {/* Fretboard body */}
          <defs>
            <linearGradient id="fbGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1510" />
              <stop offset="100%" stopColor="#0d0a07" />
            </linearGradient>
          </defs>
          <rect x="30" y="8" width={totalWidth} height="124" rx="2" fill="url(#fbGrad)" />

          {/* Nut */}
          <rect x="28" y="8" width="5" height="124" rx="1" fill="#d4c5a0" />

          {/* Fret wires and dots */}
          {(() => {
            let x = 33;
            const elements: any[] = [];

            for (let fret = 0; fret <= NUM_FRETS; fret++) {
              const w = fretWidth(fret);

              if (fret > 0) {
                // Fret wire
                elements.push(
                  <line key={`fw-${fret}`} x1={x} y1="8" x2={x} y2="132" stroke="#555" strokeWidth="1.5" />
                );

                // Dot markers
                const midX = x - w / 2;
                if (doubleDotFrets.includes(fret)) {
                  elements.push(
                    <circle key={`dot1-${fret}`} cx={midX} cy="45" r="3.5" fill="#333" />,
                    <circle key={`dot2-${fret}`} cx={midX} cy="95" r="3.5" fill="#333" />
                  );
                } else if (dotFrets.includes(fret)) {
                  elements.push(
                    <circle key={`dot-${fret}`} cx={midX} cy="70" r="3.5" fill="#333" />
                  );
                }
              }

              x += w;
            }
            return elements;
          })()}

          {/* Strings and notes */}
          {STANDARD_TUNING.map((stringMidi, stringIdx) => {
            const y = 18 + stringIdx * 22;
            const stringThickness = 0.5 + (5 - stringIdx) * 0.3;

            return (
              <g key={stringIdx}>
                {/* String line */}
                <line
                  x1="33" y1={y} x2={totalWidth + 33} y2={y}
                  stroke={stringIdx < 3 ? '#8a7a5a' : '#c0b090'}
                  strokeWidth={stringThickness}
                  opacity={0.6}
                />

                {/* String label */}
                <text x="16" y={y + 4} fill="var(--color-text-muted)" fontSize="9" textAnchor="middle" fontFamily="var(--font-mono)">
                  {TUNING_NOTES[stringIdx]}
                </text>

                {/* Notes */}
                {(() => {
                  let x = 33;
                  const notes: any[] = [];

                  for (let fret = 0; fret <= NUM_FRETS; fret++) {
                    const w = fretWidth(fret);
                    const { note } = getNoteAtFret(stringMidi, fret);
                    const isInScale = scaleNotes.includes(note);
                    const isRoot = note === root;
                    const interval = getInterval(root, note);
                    const noteX = fret === 0 ? x - w * 0.5 + 15 : x - w / 2;

                    if (isInScale) {
                      notes.push(
                        <g key={`${stringIdx}-${fret}`}>
                          <circle
                            cx={noteX}
                            cy={y}
                            r={isRoot ? 9 : 7}
                            fill={isRoot ? 'var(--color-amber-500)' : 'var(--color-surface-overlay)'}
                            stroke={isRoot ? 'var(--color-amber-400)' : 'var(--color-text-muted)'}
                            strokeWidth={isRoot ? 1.5 : 0.5}
                            opacity={0.95}
                          />
                          <text
                            x={noteX}
                            y={y + 3.5}
                            fill={isRoot ? 'var(--color-void)' : 'var(--color-text-primary)'}
                            fontSize={isRoot ? "8" : "7"}
                            textAnchor="middle"
                            fontFamily="var(--font-sans)"
                            fontWeight={isRoot ? "600" : "400"}
                          >
                            {showIntervals ? INTERVAL_NAMES[interval] : note}
                          </text>
                        </g>
                      );
                    }

                    x += w;
                  }
                  return notes;
                })()}
              </g>
            );
          })}

          {/* Fret numbers */}
          {(() => {
            let x = 33;
            const labels: any[] = [];
            for (let fret = 0; fret <= NUM_FRETS; fret++) {
              const w = fretWidth(fret);
              if (fret > 0 && (fret <= 12 || fret % 2 === 1)) {
                labels.push(
                  <text
                    key={`label-${fret}`}
                    x={x - w / 2}
                    y="140"
                    fill="var(--color-text-muted)"
                    fontSize="7"
                    textAnchor="middle"
                    fontFamily="var(--font-mono)"
                    opacity={0.5}
                  >
                    {fret}
                  </text>
                );
              }
              x += w;
            }
            return labels;
          })()}
        </svg>
      </div>
    </div>
  );
}
