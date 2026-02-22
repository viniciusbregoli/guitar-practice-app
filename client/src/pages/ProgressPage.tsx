import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { PracticeSession } from '../types/session';
import type { ProgressData } from '../types/progress';

export function ProgressPage() {
  const [sessions, setSessions] = useState<PracticeSession[]>([]);
  const [streaks, setStreaks] = useState<ProgressData | null>(null);

  useEffect(() => {
    api.getSessions().then(data => setSessions(data.sessions || [])).catch(() => {});
    api.getStreaks().then(setStreaks).catch(() => {});
  }, []);

  // Build calendar data for last 30 days
  const today = new Date();
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - 34 + i);
    const key = date.toISOString().slice(0, 10);
    const daySessions = sessions.filter(s => s.startTime.slice(0, 10) === key);
    return {
      date: key,
      dayOfMonth: date.getDate(),
      practiced: daySessions.length > 0,
      minutes: daySessions.reduce((sum, s) => sum + s.duration, 0),
      isToday: i === 34,
    };
  });

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);
  const totalHours = Math.floor(totalMinutes / 60);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-8 md:pt-12">
      <h1 className="font-display text-4xl text-amber-400 mb-8 glow-text">Progress</h1>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="p-4 rounded-xl bg-surface border border-border text-center">
          <div className="text-3xl font-display text-text-primary">{streaks?.currentStreak ?? 0}</div>
          <div className="text-xs text-text-muted uppercase tracking-widest">Streak</div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border text-center">
          <div className="text-3xl font-display text-text-primary">{sessions.length}</div>
          <div className="text-xs text-text-muted uppercase tracking-widest">Sessions</div>
        </div>
        <div className="p-4 rounded-xl bg-surface border border-border text-center">
          <div className="text-3xl font-display text-text-primary">{totalHours}h</div>
          <div className="text-xs text-text-muted uppercase tracking-widest">Total</div>
        </div>
      </div>

      {/* Practice calendar */}
      <div className="mb-8">
        <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">Last 5 Weeks</h3>
        <div className="grid grid-cols-7 gap-1">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
            <div key={i} className="text-center text-xs text-text-muted pb-1">{d}</div>
          ))}
          {calendarDays.map(day => (
            <div
              key={day.date}
              className={`aspect-square rounded-md flex items-center justify-center text-xs transition-all ${
                day.isToday ? 'ring-1 ring-amber-500/50' : ''
              } ${
                day.practiced
                  ? day.minutes >= 30
                    ? 'bg-amber-500/40 text-amber-200'
                    : 'bg-amber-500/15 text-amber-400/80'
                  : 'bg-surface text-text-muted'
              }`}
              title={day.practiced ? `${day.minutes} min` : ''}
            >
              {day.dayOfMonth}
            </div>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">Recent Sessions</h3>
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm">No sessions yet. Start practicing!</div>
        ) : (
          <div className="space-y-2">
            {sessions.slice(-10).reverse().map(session => (
              <div key={session.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface border border-border">
                <div className={`w-2 h-2 rounded-full ${
                  session.type === 'routine' ? 'bg-amber-500' : session.type === 'song' ? 'bg-routine-b' : 'bg-text-muted'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-text-primary">
                    {session.type === 'routine' ? `Routine ${session.routineName}` : session.songTitle || 'Free Play'}
                  </div>
                  <div className="text-xs text-text-muted">
                    {new Date(session.startTime).toLocaleDateString()} &middot; {session.duration} min
                    {session.selectedScale && ` &middot; ${session.selectedScale}`}
                  </div>
                </div>
                <div className="text-xs text-text-muted">
                  {session.completedExercises?.filter(e => e.completed).length ?? 0} exercises
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
