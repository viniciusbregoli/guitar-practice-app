import type { DayOfWeek } from '../types/routine';
import { WEEKLY_SCHEDULE } from '../types/routine';

const DAYS: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export function getTodayRoutine(): { day: DayOfWeek; routineName: string | null } {
  const dayIndex = new Date().getDay();
  const day = DAYS[dayIndex];
  return { day, routineName: WEEKLY_SCHEDULE[day] };
}

export function getWeekSchedule(): { day: DayOfWeek; label: string; routineName: string | null; isToday: boolean }[] {
  const today = new Date().getDay();
  return DAYS.map((day, i) => ({
    day,
    label: day.charAt(0).toUpperCase() + day.slice(1, 3),
    routineName: WEEKLY_SCHEDULE[day],
    isToday: i === today,
  }));
}

export function getRoutineColor(name: string | null): string {
  switch (name) {
    case 'A': return 'var(--color-routine-a)';
    case 'B': return 'var(--color-routine-b)';
    case 'C': return 'var(--color-routine-c)';
    default: return 'var(--color-text-muted)';
  }
}
