import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Workout } from '../types';

function formatRowDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function summarize(workout: Workout): string {
  const exerciseCount = workout.exercises.length;
  const setCount = workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => !s.isWarmup).length,
    0,
  );
  const exLabel = `${exerciseCount} ${exerciseCount === 1 ? 'lift' : 'lifts'}`;
  const setLabel = `${setCount} ${setCount === 1 ? 'set' : 'sets'}`;
  return `${exLabel} · ${setLabel}`;
}

export default function Home() {
  const { state, actions } = useApp();
  const navigate = useNavigate();

  const sorted = useMemo(
    () =>
      state.workouts.slice().sort((a, b) => b.date.localeCompare(a.date)),
    [state.workouts],
  );

  function handleStart() {
    const workout = actions.startWorkout();
    navigate(`/workout/${workout.id}`);
  }

  function handleDelete(workout: Workout) {
    const label = formatRowDate(workout.date);
    if (!window.confirm(`Delete workout from ${label}? This can't be undone.`)) return;
    actions.deleteWorkout(workout.id);
  }

  return (
    <div className="mx-auto max-w-md pb-16">
      <header className="glass-bar sticky top-0 z-20 flex items-center justify-between gap-2 px-4 py-3">
        <h1 className="text-strong text-[17px] font-semibold tracking-tight">Lift Tracker</h1>
        <nav className="flex items-center gap-0.5 text-[15px]">
          <Link
            to="/lifts"
            className="btn-ghost-accent flex min-h-11 items-center px-2.5"
          >
            Lifts
          </Link>
          <Link
            to="/progress"
            className="btn-ghost-accent flex min-h-11 items-center px-2.5"
          >
            Progress
          </Link>
          <Link
            to="/settings"
            className="btn-ghost-accent flex min-h-11 items-center px-2.5"
          >
            Settings
          </Link>
        </nav>
      </header>

      <div className="px-4 pt-7">
        <button
          type="button"
          onClick={handleStart}
          className="btn-accent min-h-14 w-full rounded-2xl py-4 text-[17px] font-semibold tracking-tight"
        >
          Start New Workout
        </button>
      </div>

      <section className="mt-8 px-4">
        <h2 className="text-faint mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
          Recent
        </h2>
        {sorted.length === 0 ? (
          <div className="glass rounded-2xl px-4 py-8 text-center">
            <p className="text-muted text-sm">No workouts yet.</p>
            <p className="text-faint mt-1 text-xs">Tap the orange button to begin.</p>
          </div>
        ) : (
          <ul className="glass divide-y divide-[var(--hairline-soft)] overflow-hidden rounded-2xl">
            {sorted.map((w) => (
              <li key={w.id} className="flex items-stretch">
                <Link
                  to={`/workout/${w.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors active:bg-white/40 dark:active:bg-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-strong text-[15px] font-medium tracking-tight">
                      {formatRowDate(w.date)}
                    </div>
                    <div className="text-muted text-[13px]">{summarize(w)}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                      w.status === 'complete'
                        ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : 'border-[var(--color-accent-500)]/30 bg-[var(--color-accent-500)]/15 text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)]'
                    }`}
                  >
                    {w.status === 'complete' ? 'Complete' : 'In progress'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(w)}
                  className="text-faint flex min-h-11 min-w-11 items-center justify-center px-2 text-xl leading-none transition-colors hover:text-red-500"
                  aria-label={`Delete workout from ${formatRowDate(w.date)}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
