export interface UserSettings {
  defaultScale: string;
  defaultBPM: number;
  metronomeSound: 'click' | 'woodblock' | 'beep';
  autoAdvanceExercises: boolean;
  warningBeforeEnd: number; // seconds
  theme: 'dark';
  backingTracks: BackingTrack[];
}

export interface BackingTrack {
  id: string;
  name: string;
  scale: string;
  youtubeUrl: string;
}

export const DEFAULT_SETTINGS: UserSettings = {
  defaultScale: 'A minor pentatonic',
  defaultBPM: 80,
  metronomeSound: 'click',
  autoAdvanceExercises: true,
  warningBeforeEnd: 5,
  theme: 'dark',
  backingTracks: [],
};
