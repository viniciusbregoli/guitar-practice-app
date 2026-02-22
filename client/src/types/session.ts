export interface PracticeSession {
  id: string;
  type: 'routine' | 'song' | 'free-play';
  startTime: string;
  endTime?: string;
  duration: number; // minutes
  routineId?: string;
  routineName?: string;
  selectedScale?: string;
  completedExercises?: CompletedExercise[];
  songId?: string;
  songTitle?: string;
  notes?: string;
}

export interface CompletedExercise {
  exerciseId: string;
  exerciseName: string;
  setNumber: number;
  duration: number;
  completed: boolean;
  skipped: boolean;
}

export interface SessionHistory {
  sessions: PracticeSession[];
}
