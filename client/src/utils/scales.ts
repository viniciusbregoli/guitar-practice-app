export const NOTES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;
export type NoteName = typeof NOTES[number];

export const SCALE_PATTERNS: Record<string, number[]> = {
  'Major':              [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor':      [0, 2, 3, 5, 7, 8, 10],
  'Minor Pentatonic':   [0, 3, 5, 7, 10],
  'Major Pentatonic':   [0, 2, 4, 7, 9],
  'Blues':              [0, 3, 5, 6, 7, 10],
  'Dorian':            [0, 2, 3, 5, 7, 9, 10],
  'Mixolydian':        [0, 2, 4, 5, 7, 9, 10],
  'Harmonic Minor':    [0, 2, 3, 5, 7, 8, 11],
};

export const INTERVAL_NAMES: Record<number, string> = {
  0: 'R', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4',
  6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7',
};

// Standard tuning: E A D G B E (low to high)
export const STANDARD_TUNING = [40, 45, 50, 55, 59, 64]; // MIDI note numbers
export const TUNING_NOTES = ['E', 'A', 'D', 'G', 'B', 'E'];
export const NUM_FRETS = 22;

export function getScaleNotes(root: NoteName, pattern: number[]): NoteName[] {
  const rootIndex = NOTES.indexOf(root);
  return pattern.map(interval => NOTES[(rootIndex + interval) % 12]);
}

export function getNoteAtFret(stringMidi: number, fret: number): { note: NoteName; midi: number } {
  const midi = stringMidi + fret;
  const note = NOTES[midi % 12];
  return { note, midi };
}

export function getInterval(root: NoteName, note: NoteName): number {
  const rootIdx = NOTES.indexOf(root);
  const noteIdx = NOTES.indexOf(note);
  return (noteIdx - rootIdx + 12) % 12;
}

export const PENTATONIC_BOXES: Record<number, { startFret: number; endFret: number }[]> = {
  1: [{ startFret: 0, endFret: 3 }],
  2: [{ startFret: 3, endFret: 5 }],
  3: [{ startFret: 5, endFret: 8 }],
  4: [{ startFret: 7, endFret: 10 }],
  5: [{ startFret: 10, endFret: 12 }],
};

export function getAllScales(): { label: string; root: NoteName; pattern: string }[] {
  const scales: { label: string; root: NoteName; pattern: string }[] = [];
  for (const root of NOTES) {
    for (const patternName of Object.keys(SCALE_PATTERNS)) {
      scales.push({
        label: `${root} ${patternName}`,
        root,
        pattern: patternName,
      });
    }
  }
  return scales;
}
