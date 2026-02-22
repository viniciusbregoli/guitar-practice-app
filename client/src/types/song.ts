export interface Song {
  id: string;
  title: string;
  artist: string;
  tuning: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  videoPath?: string;
  youtubeUrl?: string;
  sections: SongSection[];
  tags: string[];
  addedAt: string;
  lastPracticed?: string;
  practiceCount: number;
}

export interface SongSection {
  id: string;
  name: string;
  startTime: number; // seconds
  endTime: number;
  mastered: boolean;
}

export interface SongLibrary {
  songs: Song[];
  updatedAt: string;
}
