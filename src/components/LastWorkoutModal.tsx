import { useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import type { Workout, WorkoutType } from '../types';
import { workoutTypeLabel, workoutTypePillClasses } from '../lib/workoutType';

interface Props {
  workoutType: WorkoutType;
  excludeWorkoutId: string;
  onClose: () => void;
}

function formatRefDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (sameDay(d, yesterday)) return 'Yesterday';
  const diffDays = Math.floor((today.getTime() - d.getTime()) / 86_400_000);
  if (diffDays >= 1 && diffDays <= 13) return `${diffDays} days ago`;
  return d.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: today.getFullYear() === d.getFullYear() ? undefined : 'numeric',
  });
}

export default function LastWorkoutModal({
  workoutType,
  excludeWorkoutId,
  onClose,
}: Props) {
  const { state } = useApp();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const lastWorkout = useMemo<Workout | null>(() => {
    const matches = state.workouts.filter(
      (w) =>
        w.id !== excludeWorkoutId &&
        w.status === 'complete' &&
        w.type === workoutType,
    );
    matches.sort((a, b) => b.date.localeCompare(a.date));
    return matches[0] ?? null;
  }, [state.workouts, workoutType, excludeWorkoutId]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          'radial-gradient(120% 80% at 0% 0%, var(--bg-grad-1) 0%, transparent 55%),' +
          'radial-gradient(120% 80% at 100% 0%, var(--bg-grad-2) 0%, transparent 55%),' +
          'linear-gradient(180deg, var(--bg-grad-3) 0%, var(--bg-grad-4) 100%)',
      }}
    >
      <header className="glass-bar flex items-center justify-between gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onClose}
          className="btn-ghost-accent -ml-1 min-h-11 px-2 text-[15px]"
        >
          Close
        </button>
        <h2 className="text-strong text-[17px] font-semibold tracking-tight">
          Last {workoutTypeLabel(workoutType)} Day
        </h2>
        <span className="min-w-11" />
      </header>

      {!lastWorkout ? (
        <div className="flex-1 px-4 pt-8">
          <div className="glass-quiet rounded-2xl px-6 py-12 text-center">
            <p className="text-strong text-[15px] font-medium">
              No previous {workoutTypeLabel(workoutType).toLowerCase()} day yet.
            </p>
            <p className="text-muted mt-1 text-[13px]">
              Once you complete one, it will show up here for reference.
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-4 pb-[max(env(safe-area-inset-bottom),1rem)]">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-strong text-[15px] font-semibold tracking-tight">
                {formatRefDate(lastWorkout.date)}
              </div>
              <div className="text-faint num-mono text-[11px] tracking-[0.06em]">
                {new Date(lastWorkout.date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                })}
              </div>
            </div>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${workoutTypePillClasses(workoutType)}`}
            >
              {workoutTypeLabel(workoutType)}
            </span>
          </div>

          {lastWorkout.exercises.length === 0 ? (
            <div className="glass-quiet rounded-2xl px-4 py-8 text-center">
              <p className="text-muted text-[13px]">No exercises were logged.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {lastWorkout.exercises.map((exercise) => {
                const lift = state.lifts.find((l) => l.id === exercise.liftId);
                const liftName = lift?.name ?? 'Unknown lift';
                const workingSets = exercise.sets.filter((s) => !s.isWarmup);
                const warmupSets = exercise.sets.filter((s) => s.isWarmup);
                return (
                  <section
                    key={exercise.id}
                    className="glass overflow-hidden rounded-2xl"
                  >
                    <header className="flex items-center gap-2 border-b border-[var(--hairline-soft)] px-3.5 py-2.5">
                      <h3 className="text-strong min-w-0 flex-1 truncate text-[14px] font-semibold tracking-tight">
                        {liftName}
                      </h3>
                      {lift?.category && (
                        <span className="num-mono text-faint shrink-0 text-[9px] uppercase tracking-[0.12em]">
                          {lift.category}
                        </span>
                      )}
                    </header>
                    <div className="px-3.5 py-2.5">
                      {exercise.sets.length === 0 ? (
                        <p className="text-muted text-[13px]">No sets.</p>
                      ) : (
                        <ul className="flex flex-col gap-1">
                          {warmupSets.map((s, i) => (
                            <li
                              key={s.id}
                              className="num-mono flex items-center gap-2 text-[13px]"
                            >
                              <span className="text-faint w-6 text-[10px] uppercase tracking-[0.08em]">
                                W{warmupSets.length > 1 ? i + 1 : ''}
                              </span>
                              <span className="text-muted tabular-nums">
                                {s.weight} lb × {s.reps}
                              </span>
                            </li>
                          ))}
                          {workingSets.map((s, i) => (
                            <li
                              key={s.id}
                              className={`num-mono flex items-center gap-2 text-[13px] ${
                                s.completed ? '' : 'opacity-60'
                              }`}
                            >
                              <span className="text-faint w-6 text-[10px] tracking-[0.08em]">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className="text-strong tabular-nums">
                                {s.weight} lb × {s.reps}
                              </span>
                              {!s.completed && (
                                <span className="text-faint text-[10px] uppercase tracking-[0.08em]">
                                  skipped
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
