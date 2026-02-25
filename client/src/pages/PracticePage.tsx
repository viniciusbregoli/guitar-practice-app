import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { getTodayRoutine } from '../utils/schedule';
import { getAllScales } from '../utils/scales';
import { useTimer } from '../hooks/useTimer';
import { useMetronome } from '../hooks/useMetronome';
import { Fretboard } from '../components/fretboard/Fretboard';
import type { Routine, RoutineSet, Exercise } from '../types/routine';
import type { PracticeSession, CompletedExercise } from '../types/session';

type Phase = 'setup' | 'active' | 'complete';

type SessionStep = {
  key: string;
  setNumber: number;
  exerciseId?: string;
};

export function PracticePage() {
  const [searchParams] = useSearchParams();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [selectedScale, setSelectedScale] = useState('A Minor Pentatonic');
  const [phase, setPhase] = useState<Phase>('setup');
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<CompletedExercise[]>([]);
  const [sessionStartTime] = useState(new Date().toISOString());
  // For "pick one" sets, the chosen exercise
  const [pickedExercise, setPickedExercise] = useState<Exercise | null>(null);

  const scales = getAllScales();
  const { routineName: todayRoutine } = getTodayRoutine();

  useEffect(() => {
    api.getRoutines().then(r => {
      setRoutines(r);
      const param = searchParams.get('routine');
      const target = param || todayRoutine;
      if (target) {
        const found = r.find((rt: Routine) => rt.name === target);
        if (found) setSelectedRoutine(found);
      }
    }).catch(() => {});
  }, [searchParams, todayRoutine]);

  const currentSet = selectedRoutine?.sets[currentSetIndex];
  const currentExercise = currentSet?.type === 'pick-one'
    ? pickedExercise
    : currentSet?.exercises[currentExerciseIndex];

  const exerciseDuration = (currentExercise?.duration ?? 0) * 60;
  const canGoBack = completedExercises.length > 0 || (currentSet?.type === 'pick-one' && pickedExercise !== null);

  const sessionSteps: SessionStep[] = selectedRoutine
    ? selectedRoutine.sets.flatMap((set) => {
        if (set.type === 'pick-one') {
          return [{ key: `set-${set.id}`, setNumber: set.number }];
        }
        return set.exercises.map((exercise) => ({
          key: `exercise-${exercise.id}`,
          setNumber: set.number,
          exerciseId: exercise.id,
        }));
      })
    : [];

  const completedByStep = new Map<string, CompletedExercise>();
  if (selectedRoutine) {
    for (const entry of completedExercises) {
      const set = selectedRoutine.sets.find(s => s.number === entry.setNumber);
      if (!set) continue;
      const key = set.type === 'pick-one' ? `set-${set.id}` : `exercise-${entry.exerciseId}`;
      completedByStep.set(key, entry);
    }
  }

  const currentStepKey = (() => {
    if (!currentSet) return null;
    if (currentSet.type === 'pick-one') return `set-${currentSet.id}`;
    const current = currentSet.exercises[currentExerciseIndex];
    if (!current) return null;
    return `exercise-${current.id}`;
  })();

  const doneOrSkippedCount = sessionSteps.reduce((total, step) => (
    completedByStep.has(step.key) ? total + 1 : total
  ), 0);
  const leftCount = Math.max(0, sessionSteps.length - doneOrSkippedCount);

  const handleExerciseComplete = useCallback(() => {
    if (!currentExercise || !currentSet) return;

    setCompletedExercises(prev => [...prev, {
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      setNumber: currentSet.number,
      duration: currentExercise.duration,
      completed: true,
      skipped: false,
    }]);

    // Advance to next exercise or set
    if (currentSet.type === 'pick-one') {
      // Pick-one sets are a single block
      advanceToNextSet();
    } else if (currentExerciseIndex < currentSet.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      advanceToNextSet();
    }
  }, [currentExercise, currentSet, currentExerciseIndex]);

  const advanceToNextSet = useCallback(() => {
    if (!selectedRoutine) return;
    if (currentSetIndex < selectedRoutine.sets.length - 1) {
      setCurrentSetIndex(prev => prev + 1);
      setCurrentExerciseIndex(0);
      setPickedExercise(null);
    } else {
      finishSession();
    }
  }, [selectedRoutine, currentSetIndex]);

  const skipExercise = useCallback(() => {
    if (!currentExercise || !currentSet) return;
    setCompletedExercises(prev => [...prev, {
      exerciseId: currentExercise.id,
      exerciseName: currentExercise.name,
      setNumber: currentSet.number,
      duration: currentExercise.duration,
      completed: false,
      skipped: true,
    }]);

    if (currentSet.type === 'pick-one') {
      advanceToNextSet();
    } else if (currentExerciseIndex < currentSet.exercises.length - 1) {
      setCurrentExerciseIndex(prev => prev + 1);
    } else {
      advanceToNextSet();
    }
  }, [currentExercise, currentSet, currentExerciseIndex, advanceToNextSet]);

  const goToPreviousExercise = useCallback(() => {
    if (!selectedRoutine) return;

    // If user is inside a pick-one set but hasn't progressed, go back to topic selection.
    if (currentSet?.type === 'pick-one' && pickedExercise && completedExercises.length === 0) {
      setPickedExercise(null);
      return;
    }

    const lastCompleted = completedExercises[completedExercises.length - 1];
    if (!lastCompleted) return;

    const targetSetIndex = selectedRoutine.sets.findIndex(set => set.number === lastCompleted.setNumber);
    if (targetSetIndex === -1) return;

    const targetSet = selectedRoutine.sets[targetSetIndex];
    setCurrentSetIndex(targetSetIndex);

    if (targetSet.type === 'pick-one') {
      const targetExercise = targetSet.exercises.find(ex => ex.id === lastCompleted.exerciseId) ?? null;
      setPickedExercise(targetExercise);
      setCurrentExerciseIndex(0);
    } else {
      const targetExerciseIndex = targetSet.exercises.findIndex(ex => ex.id === lastCompleted.exerciseId);
      setCurrentExerciseIndex(targetExerciseIndex >= 0 ? targetExerciseIndex : 0);
      setPickedExercise(null);
    }

    setCompletedExercises(prev => prev.slice(0, -1));
  }, [selectedRoutine, currentSet, pickedExercise, completedExercises]);

  const finishSession = useCallback(async () => {
    setPhase('complete');
    const session: PracticeSession = {
      id: crypto.randomUUID(),
      type: 'routine',
      startTime: sessionStartTime,
      endTime: new Date().toISOString(),
      duration: Math.round((Date.now() - new Date(sessionStartTime).getTime()) / 60000),
      routineId: selectedRoutine?.id,
      routineName: selectedRoutine?.name,
      selectedScale,
      completedExercises,
    };
    try {
      await api.saveSession(session);
    } catch {
      // Store locally as fallback
    }
  }, [sessionStartTime, selectedRoutine, selectedScale, completedExercises]);

  // ─── Setup Phase ───
  if (phase === 'setup') {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pt-6 md:pt-10">
        <h1 className="font-display text-4xl text-text-primary mb-8">Session Setup</h1>

        {/* Routine selector */}
        <div className="mb-6">
          <label className="text-xs uppercase tracking-widest text-text-muted mb-2 block">Routine</label>
          <div className="flex gap-2">
            {routines.map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedRoutine(r)}
                className={`flex-1 py-3 rounded-lg font-display text-2xl transition-all ${
                  selectedRoutine?.id === r.id
                    ? 'border-2 shadow-lg'
                    : 'bg-surface border border-border text-text-muted hover:text-text-primary'
                }`}
                style={selectedRoutine?.id === r.id ? {
                  borderColor: r.color,
                  color: r.color,
                  backgroundColor: `${r.color}10`,
                  boxShadow: `0 0 20px ${r.color}15`,
                } : {}}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Scale selector */}
        <div className="mb-8">
          <label className="text-xs uppercase tracking-widest text-text-muted mb-2 block">Scale</label>
          <select
            value={selectedScale}
            onChange={e => setSelectedScale(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary appearance-none cursor-pointer focus:outline-none focus:border-amber-500/50"
          >
            {scales.map(s => (
              <option key={s.label} value={s.label}>{s.label}</option>
            ))}
          </select>
        </div>

        {/* Routine preview */}
        {selectedRoutine && (
          <div className="mb-8 space-y-3">
            <h3 className="text-xs uppercase tracking-widest text-text-muted">Sets</h3>
            {selectedRoutine.sets.map((set) => (
              <div key={set.id} className="p-4 rounded-lg bg-surface border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-surface-raised text-text-muted">
                    SET {set.number}
                  </span>
                  <span className="text-sm text-text-secondary">{set.name}</span>
                  <span className="ml-auto text-xs text-text-muted">{set.totalDuration} min</span>
                </div>
                <div className="space-y-1">
                  {set.exercises.map(ex => (
                    <div key={ex.id} className="text-xs text-text-muted flex gap-2">
                      <span className="text-text-secondary shrink-0">{ex.duration}m</span>
                      <span>{ex.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => setPhase('active')}
          disabled={!selectedRoutine}
          className="w-full py-4 rounded-xl bg-amber-500 text-void font-medium text-lg hover:bg-amber-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Begin Session
        </button>
      </div>
    );
  }

  // ─── Active Phase ───
  if (phase === 'active' && currentSet) {
    // If pick-one and hasn't picked yet
    if (currentSet.type === 'pick-one' && !pickedExercise) {
      return (
        <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 pt-6 md:pt-10">
          <SetHeader set={currentSet} routine={selectedRoutine!} />
          <SessionProgressDots
            steps={sessionSteps}
            completedByStep={completedByStep}
            currentStepKey={currentStepKey}
            doneOrSkippedCount={doneOrSkippedCount}
            leftCount={leftCount}
          />
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-xl text-text-primary">Pick a topic</h2>
            {canGoBack && (
              <button
                onClick={goToPreviousExercise}
                className="px-3 py-1.5 rounded-lg text-xs border border-border text-text-muted hover:text-text-primary hover:bg-surface-raised transition-all"
              >
                Go Back
              </button>
            )}
          </div>
          <div className="space-y-2">
            {currentSet.exercises.map(ex => (
              <button
                key={ex.id}
                onClick={() => setPickedExercise(ex)}
                className="w-full text-left p-4 rounded-lg bg-surface border border-border hover:border-amber-500/30 transition-all"
              >
                <div className="text-text-primary font-medium">{ex.name}</div>
                {ex.description && (
                  <div className="text-xs text-text-muted mt-1">{ex.description}</div>
                )}
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (!currentExercise) return null;

    return (
      <div className="px-4 md:px-6 lg:px-8 pt-6 md:pt-10">
        <div className="max-w-6xl mx-auto">
          <SetHeader set={currentSet} routine={selectedRoutine!} />
          <SessionProgressDots
            steps={sessionSteps}
            completedByStep={completedByStep}
            currentStepKey={currentStepKey}
            doneOrSkippedCount={doneOrSkippedCount}
            leftCount={leftCount}
          />
          <ExercisePlayer
            key={currentExercise.id}
            exercise={currentExercise}
            durationSeconds={exerciseDuration}
            canGoBack={canGoBack}
            onBack={goToPreviousExercise}
            onComplete={handleExerciseComplete}
            onSkip={skipExercise}
            scale={selectedScale}
          />
        </div>
        {/* Fretboard - full width, always visible */}
        <div className="mt-8 max-w-6xl mx-auto">
          <div className="p-4 rounded-xl bg-surface border border-border">
            <Fretboard root={selectedScale.split(' ')[0] as any} scalePattern={selectedScale.replace(/^[A-G]#?\s*/, '')} />
          </div>
        </div>
      </div>
    );
  }

  // ─── Complete Phase ───
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 lg:px-8 pt-14 md:pt-20 text-center">
      <div className="text-6xl mb-4 font-display text-amber-400 glow-text">Done</div>
      <p className="text-text-secondary mb-2">
        Routine {selectedRoutine?.name} complete
      </p>
      <p className="text-sm text-text-muted mb-8">
        {completedExercises.filter(e => e.completed).length} exercises completed
      </p>
      <button
        onClick={() => {
          setPhase('setup');
          setCurrentSetIndex(0);
          setCurrentExerciseIndex(0);
          setPickedExercise(null);
          setCompletedExercises([]);
        }}
        className="px-6 py-3 rounded-xl bg-surface border border-border text-text-primary hover:border-amber-500/30 transition-all"
      >
        Start Another Session
      </button>
    </div>
  );
}

// ─── Sub-components ───

function SetHeader({ set, routine }: { set: RoutineSet; routine: Routine }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span
        className="text-sm font-display px-3 py-1 rounded-md"
        style={{ backgroundColor: `${routine.color}15`, color: routine.color }}
      >
        Routine {routine.name}
      </span>
      <span className="text-xs font-mono text-text-muted">SET {set.number}</span>
      <span className="text-xs text-text-secondary">{set.name}</span>
    </div>
  );
}

function SessionProgressDots({
  steps,
  completedByStep,
  currentStepKey,
  doneOrSkippedCount,
  leftCount,
}: {
  steps: SessionStep[];
  completedByStep: Map<string, CompletedExercise>;
  currentStepKey: string | null;
  doneOrSkippedCount: number;
  leftCount: number;
}) {
  if (steps.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[10px] uppercase tracking-widest text-text-muted">Progress</span>
        <span className="text-xs text-text-muted">
          <span className="text-text-secondary">{doneOrSkippedCount}</span> done/skipped ·{' '}
          <span className="text-text-secondary">{leftCount}</span> left
        </span>
      </div>
      <div className="flex items-center flex-wrap gap-1.5">
        {steps.map((step, index) => {
          const entry = completedByStep.get(step.key);
          const isCurrent = step.key === currentStepKey;
          const stateClass = isCurrent
            ? 'w-3.5 h-3.5 bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.45)]'
            : entry
              ? entry.skipped
                ? 'w-2.5 h-2.5 bg-text-muted/70 border border-text-muted/60'
                : 'w-2.5 h-2.5 bg-amber-500'
              : 'w-2.5 h-2.5 bg-surface-raised border border-border';

          const status = isCurrent ? 'Current' : entry ? (entry.skipped ? 'Skipped' : 'Completed') : 'Pending';

          return (
            <span
              key={step.key}
              className={`rounded-full transition-all duration-200 ${stateClass}`}
              title={`Exercise ${index + 1}: ${status}`}
            />
          );
        })}
      </div>
    </div>
  );
}

function ExercisePlayer({
  exercise,
  durationSeconds,
  canGoBack,
  onBack,
  onComplete,
  onSkip,
  scale,
}: {
  exercise: Exercise;
  durationSeconds: number;
  canGoBack: boolean;
  onBack: () => void;
  onComplete: () => void;
  onSkip: () => void;
  scale: string;
}) {
  const timer = useTimer(durationSeconds, onComplete);
  const metro = useMetronome(80);

  const isWarning = timer.remaining <= 5 && timer.remaining > 0;

  return (
    <div className="space-y-6">
      {/* Exercise name & description */}
      <div>
        <h2 className="text-2xl font-display text-text-primary mb-2">{exercise.name}</h2>
        {exercise.description && (
          <p className="text-sm text-text-secondary leading-relaxed">{exercise.description}</p>
        )}
        {exercise.instructions && (
          <p className="text-xs text-text-muted mt-2 italic">{exercise.instructions}</p>
        )}
        <div className="text-xs text-amber-400/60 mt-2">Scale: {scale}</div>
      </div>

      {/* Timer + Metronome */}
      <div className="flex items-stretch rounded-2xl bg-surface border border-border overflow-hidden">
        {/* Timer */}
        <div className="flex-1 flex items-center justify-center py-10">
          <div className="relative w-48 h-48">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="var(--color-border)" strokeWidth="3" />
              <circle
                cx="50" cy="50" r="44"
                fill="none"
                stroke={isWarning ? '#ef4444' : 'var(--color-amber-500)'}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - timer.progress)}`}
                className="transition-all duration-200"
                style={isWarning ? { filter: 'drop-shadow(0 0 8px rgba(239,68,68,0.5))' } : {}}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-5xl font-light tabular-nums ${isWarning ? 'text-red-400' : 'text-text-primary'}`}>
                {timer.minutes}:{String(timer.seconds).padStart(2, '0')}
              </span>
              <span className="text-sm text-text-muted mt-1">{exercise.duration} min</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px bg-border my-8 shrink-0" />

        {/* Metronome */}
        <div className="flex-1 flex flex-col items-center justify-center gap-4 py-10">
          {/* BPM */}
          <div className="text-center leading-none">
            <div className="text-7xl font-light tabular-nums text-text-primary">{metro.bpm}</div>
            <div className="text-xs text-text-muted uppercase tracking-widest mt-1">bpm</div>
          </div>

          {/* Beat dots */}
          <div className="flex gap-2.5">
            {[0, 1, 2, 3].map(i => (
              <div
                key={i}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-75 ${
                  metro.isPlaying && metro.currentBeat === i
                    ? i === 0 ? 'bg-amber-400 scale-125 shadow-[0_0_10px_rgba(251,191,36,0.7)]' : 'bg-text-primary scale-110'
                    : i === 0 ? 'bg-amber-500/30 border border-amber-500/50' : 'bg-surface-raised border border-border'
                }`}
              />
            ))}
          </div>

          {/* −  play  + */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => metro.setBpm(metro.bpm - 1)}
              className="w-9 h-9 rounded-lg bg-surface-raised border border-border text-text-muted hover:text-text-primary hover:border-amber-500/30 transition-all text-lg leading-none"
            >−</button>
            <button
              onClick={metro.toggle}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                metro.isPlaying
                  ? 'bg-amber-500 text-void shadow-[0_0_20px_rgba(255,193,7,0.3)] hover:bg-amber-400'
                  : 'bg-surface-raised border border-amber-500/40 text-amber-400 hover:border-amber-500'
              }`}
            >
              {metro.isPlaying ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="6 3 20 12 6 21" />
                </svg>
              )}
            </button>
            <button
              onClick={() => metro.setBpm(metro.bpm + 1)}
              className="w-9 h-9 rounded-lg bg-surface-raised border border-border text-text-muted hover:text-text-primary hover:border-amber-500/30 transition-all text-lg leading-none"
            >+</button>
          </div>

          {/* Quick presets */}
          <div className="flex gap-1.5">
            {[60, 80, 100, 120].map(bpm => (
              <button
                key={bpm}
                onClick={() => metro.setBpm(bpm)}
                className={`text-xs px-2.5 py-1 rounded transition-all ${
                  metro.bpm === bpm ? 'bg-amber-500/15 text-amber-400' : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                {bpm}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <button
          onClick={onBack}
          disabled={!canGoBack}
          className="w-14 h-14 rounded-full bg-surface-raised border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M11 6L3 12l8 6V6zm2 0h2v12h-2V6z" />
          </svg>
        </button>

        <button
          onClick={() => timer.isRunning ? timer.pause() : timer.start()}
          className="w-14 h-14 rounded-full bg-surface-raised border border-border flex items-center justify-center text-text-primary hover:border-amber-500/30 transition-all"
        >
          {timer.isRunning ? (
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="6 3 20 12 6 21" />
            </svg>
          )}
        </button>

        <button
          onClick={onSkip}
          className="w-14 h-14 rounded-full bg-surface-raised border border-border flex items-center justify-center text-text-muted hover:text-text-primary hover:border-border transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M5 4l10 8-10 8V4zM19 5v14h-2V5h2z" />
          </svg>
        </button>

        <button
          onClick={onComplete}
          className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 hover:bg-amber-500/20 transition-all"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
