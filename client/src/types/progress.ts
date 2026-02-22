export interface ProgressData {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  totalPracticeTime: number; // minutes
  lastPracticeDate: string;
  calendar: Record<string, DayEntry>; // YYYY-MM-DD -> entry
}

export interface DayEntry {
  practiced: boolean;
  sessionIds: string[];
  totalMinutes: number;
}

export interface TopicRotation {
  [routineId: string]: {
    [setId: string]: RotationTracker;
  };
}

export interface RotationTracker {
  currentIndex: number;
  topics: TopicProgress[];
  lastRotated: string;
}

export interface TopicProgress {
  id: string;
  name: string;
  practiceCount: number;
  lastPracticed?: string;
}
