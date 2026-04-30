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
        <h1 className="text-xl font-bold">Workout not found</h1>
        <Link to="/" className="mt-4 inline-block text-blue-600 underline">
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
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Link
          to="/"
          className="min-h-11 px-2 -ml-2 text-base text-blue-600 flex items-center"
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
            className="mx-auto block min-h-11 rounded border border-transparent bg-transparent px-2 text-center text-sm font-medium tabular-nums hover:border-gray-200 focus:border-blue-500 focus:outline-none"
          />
          {isComplete && (
            <div className="text-xs uppercase tracking-wide text-green-700">Complete</div>
          )}
        </div>
        {isComplete ? (
          <span className="min-w-11" />
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={!canFinish}
            className="min-h-11 rounded-md bg-green-600 px-3 text-sm font-semibold text-white disabled:bg-gray-300"
          >
            Finish
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3 px-3 py-3">
        {workout.exercises.length === 0 && (
          <p className="px-1 py-6 text-center text-sm text-gray-500">
            No exercises yet. Tap + Add Exercise to start.
          </p>
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
            className="min-h-12 w-full rounded-lg border border-dashed border-gray-300 bg-white text-base font-medium text-blue-600"
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
