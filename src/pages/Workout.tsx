import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ExerciseCard from '../components/ExerciseCard';
import AddExerciseModal from '../components/AddExerciseModal';

function isoToLocalDateInput(iso: string): string {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Combine the picked YYYY-MM-DD with the original ISO's local time-of-day so
// same-day ordering and timestamps don't get clobbered when only the date moves.
function dateInputToIso(value: string, originalIso: string): string {
  const parts = value.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) return originalIso;
  const [y, m, day] = parts as [number, number, number];
  const o = new Date(originalIso);
  const next = new Date(
    y,
    m - 1,
    day,
    o.getHours(),
    o.getMinutes(),
    o.getSeconds(),
    o.getMilliseconds(),
  );
  return next.toISOString();
}

export default function Workout() {
  const { id } = useParams();
  const { state, actions } = useApp();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const workout = useMemo(
    () => state.workouts.find((w) => w.id === id),
    [state.workouts, id],
  );

  if (!workout) {
    return (
      <div className="mx-auto max-w-md p-4">
        <h1 className="text-strong text-xl font-semibold tracking-tight">
          Workout not found
        </h1>
        <Link to="/" className="btn-ghost-accent mt-4 inline-block text-[15px]">
          ← Home
        </Link>
      </div>
    );
  }

  const isComplete = workout.status === 'complete';
  const completedSetCount = workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => s.completed).length,
    0,
  );
  const canFinish = completedSetCount > 0;

  function handleFinish() {
    if (!workout) return;
    if (!window.confirm('Finish this workout?')) return;
    actions.finishWorkout(workout.id);
    navigate('/');
  }

  return (
    <div className="mx-auto max-w-md pb-32">
      <header className="glass-bar sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2.5">
        <Link
          to="/"
          className="btn-ghost-accent -ml-1 flex min-h-11 items-center px-2 text-[15px]"
        >
          ← Home
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <input
            type="date"
            value={isoToLocalDateInput(workout.date)}
            onChange={(e) =>
              actions.updateWorkoutDate(workout.id, dateInputToIso(e.target.value, workout.date))
            }
            aria-label="Workout date"
            className="text-strong mx-auto block min-h-11 rounded-lg border border-transparent bg-transparent px-2 text-center text-[14px] font-medium tabular-nums tracking-tight transition-colors hover:border-[var(--hairline)] focus:border-[var(--color-accent-500)] focus:outline-none"
          />
          {isComplete && (
            <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
              Complete
            </div>
          )}
        </div>
        {isComplete ? (
          <span className="min-w-11" />
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={!canFinish}
            className="btn-accent min-h-11 rounded-full px-4 text-[14px] font-semibold tracking-tight"
          >
            Finish
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3 px-3 py-4">
        {workout.exercises.length === 0 && (
          <div className="glass-quiet rounded-2xl px-4 py-10 text-center">
            <p className="text-muted text-sm">No exercises yet.</p>
            <p className="text-faint mt-1 text-xs">
              Tap + Add Exercise to start.
            </p>
          </div>
        )}

        {workout.exercises.map((exercise) => (
          <ExerciseCard
            key={exercise.id}
            workoutId={workout.id}
            exercise={exercise}
            readOnly={isComplete}
          />
        ))}

        {!isComplete && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-glass min-h-12 w-full rounded-2xl text-[15px] font-semibold tracking-tight text-[var(--color-accent-600)] dark:text-[var(--color-accent-300)]"
          >
            + Add Exercise
          </button>
        )}
      </div>

      {adding && (
        <AddExerciseModal
          onCancel={() => setAdding(false)}
          onSelect={(liftId) => {
            actions.addExercise(workout.id, liftId);
            setAdding(false);
          }}
        />
      )}
    </div>
  );
}
