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
    <div className="mx-auto max-w-md pb-12">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3">
        <h1 className="text-lg font-semibold">Lift Tracker</h1>
        <nav className="flex items-center gap-1 text-sm">
          <Link to="/lifts" className="min-h-11 px-2 text-blue-600 flex items-center">
            Lifts
          </Link>
          <Link to="/progress" className="min-h-11 px-2 text-blue-600 flex items-center">
            Progress
          </Link>
          <Link to="/settings" className="min-h-11 px-2 text-blue-600 flex items-center">
            Settings
          </Link>
        </nav>
      </header>

      <div className="px-4 pt-6">
        <button
          type="button"
          onClick={handleStart}
          className="w-full rounded-xl bg-blue-600 py-5 text-lg font-semibold text-white shadow-sm active:bg-blue-700"
        >
          Start New Workout
        </button>
      </div>

      <section className="mt-8 px-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Recent
        </h2>
        {sorted.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No workouts yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
            {sorted.map((w) => (
              <li key={w.id} className="flex items-stretch">
                <Link
                  to={`/workout/${w.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 hover:bg-gray-50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{formatRowDate(w.date)}</div>
                    <div className="text-sm text-gray-500">{summarize(w)}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      w.status === 'complete'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {w.status === 'complete' ? 'Complete' : 'In progress'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => handleDelete(w)}
                  className="flex min-h-11 min-w-11 items-center justify-center px-2 text-xl leading-none text-gray-400 hover:text-red-600"
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
