export interface Routine {
  id: string;
  name: string;
  label: string;
  description?: string;
  color: string;
  sets: RoutineSet[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoutineSet {
  id: string;
  number: 1 | 2 | 3;
  name: string;
  type: 'timed-exercises' | 'pick-one' | 'backing-track';
  totalDuration: number; // minutes
  exercises: Exercise[];
}

export interface Exercise {
  id: string;
  name: string;
  duration: number; // minutes
  description: string;
  instructions?: string;
  bpm?: { min: number; max: number };
  useMetronome?: boolean;
  useBackingTrack?: boolean;
}

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export const WEEKLY_SCHEDULE: Record<DayOfWeek, string | null> = {
  monday: 'A',
  tuesday: 'B',
  wednesday: 'C',
  thursday: 'A',
  friday: 'B',
  saturday: 'C',
  sunday: null, // Free play / Songwriting
};
