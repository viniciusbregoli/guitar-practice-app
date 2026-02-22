import { Link } from 'react-router-dom';
import { getTodayRoutine, getWeekSchedule, getRoutineColor } from '../utils/schedule';
import { useEffect, useState } from 'react';
import { api } from '../services/api';
import type { ProgressData } from '../types/progress';

export function HomePage() {
  const { day, routineName } = getTodayRoutine();
  const week = getWeekSchedule();
  const [streaks, setStreaks] = useState<ProgressData | null>(null);

  useEffect(() => {
    api.getStreaks().then(setStreaks).catch(() => {});
  }, []);

  const dayLabel = day.charAt(0).toUpperCase() + day.slice(1);

  return (
    <div className="max-w-3xl mx-auto px-6 pt-8 md:pt-12">
      {/* Header */}
      <div className="mb-10">
        <h2 className="text-text-muted text-sm uppercase tracking-widest mb-1">{dayLabel}</h2>
        <h1 className="font-display text-5xl md:text-6xl text-text-primary leading-tight">
          {routineName ? (
            <>
              Routine{' '}
              <span className="glow-text" style={{ color: getRoutineColor(routineName) }}>
                {routineName}
              </span>
            </>
          ) : (
            <span className="text-amber-400 glow-text">Free Play</span>
          )}
        </h1>
        {routineName && (
          <p className="text-text-secondary mt-2">
            {routineName === 'A' && '3 sets — Technical facility, vocabulary & application'}
            {routineName === 'B' && '3 sets — Chord work, ear training & rhythm'}
            {routineName === 'C' && '3 sets — Speed drills, expression & soloing'}
          </p>
        )}
      </div>

      {/* Start button */}
      <Link
        to={routineName ? `/practice?routine=${routineName}` : '/practice'}
        className="group flex items-center gap-4 w-full p-5 rounded-xl bg-surface border border-border hover:border-amber-500/30 transition-all duration-300 mb-8 hover:shadow-[0_0_30px_rgba(255,193,7,0.08)]"
      >
        <div
          className="w-14 h-14 rounded-xl flex items-center justify-center transition-all group-hover:scale-105"
          style={{
            backgroundColor: routineName ? `${getRoutineColor(routineName)}15` : 'rgba(255,193,7,0.1)',
            color: routineName ? getRoutineColor(routineName) : 'var(--color-amber-500)',
          }}
        >
          <svg className="w-7 h-7 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="6 3 20 12 6 21" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="text-lg font-medium text-text-primary">
            {routineName ? `Start Routine ${routineName}` : 'Start Free Session'}
          </div>
          <div className="text-sm text-text-muted">
            {routineName ? '~30 min guided session' : 'Practice at your own pace'}
          </div>
        </div>
        <svg className="w-5 h-5 text-text-muted group-hover:text-text-secondary group-hover:translate-x-1 transition-all" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M9 18l6-6-6-6" />
        </svg>
      </Link>

      {/* Week schedule */}
      <div className="mb-8">
        <h3 className="text-xs uppercase tracking-widest text-text-muted mb-3">This Week</h3>
        <div className="flex gap-2">
          {week.map(d => (
            <div
              key={d.day}
              className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-lg transition-all ${
                d.isToday ? 'bg-surface-raised border border-border' : ''
              }`}
            >
              <span className={`text-xs ${d.isToday ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
                {d.label}
              </span>
              <span
                className="text-lg font-display"
                style={{ color: d.routineName ? getRoutineColor(d.routineName) : 'var(--color-text-muted)' }}
              >
                {d.routineName || '~'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <Link
          to="/songs"
          className="group p-4 rounded-xl bg-surface border border-border hover:border-amber-500/20 transition-all"
        >
          <div className="text-2xl mb-2">
            <svg className="w-6 h-6 text-text-muted group-hover:text-amber-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d="M9 18V5l12-2v13" />
              <circle cx="6" cy="18" r="3" />
              <circle cx="18" cy="16" r="3" />
            </svg>
          </div>
          <div className="text-sm font-medium text-text-primary">Song Practice</div>
          <div className="text-xs text-text-muted">Video player with loops</div>
        </Link>

        <Link
          to="/metronome"
          className="group p-4 rounded-xl bg-surface border border-border hover:border-amber-500/20 transition-all"
        >
          <div className="text-2xl mb-2">
            <svg className="w-6 h-6 text-text-muted group-hover:text-amber-400 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
              <path d="M12 2L8 22h8L12 2z" />
              <path d="M12 8l5-3" />
              <circle cx="12" cy="14" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div className="text-sm font-medium text-text-primary">Metronome</div>
          <div className="text-xs text-text-muted">Tap tempo & patterns</div>
        </Link>
      </div>

      {/* Streak */}
      {streaks && streaks.currentStreak > 0 && (
        <div className="p-4 rounded-xl bg-surface border border-border text-center">
          <div className="text-3xl font-display text-amber-400">{streaks.currentStreak}</div>
          <div className="text-xs text-text-muted uppercase tracking-widest">day streak</div>
        </div>
      )}
    </div>
  );
}
