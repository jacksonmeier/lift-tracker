import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import ExerciseCard from '../components/ExerciseCard';
import AddExerciseModal from '../components/AddExerciseModal';
import { WORKOUT_TYPES, type WorkoutType } from '../types';
import { workoutTypeLabel, workoutTypePillClasses } from '../lib/workoutType';
import { dateInputToIso, isoToLocalDateInput } from '../lib/dates';

function formatTonnage(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
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
      <div className="route mx-auto max-w-md p-4">
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
  const totalNonWarm = workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => !s.isWarmup).length,
    0,
  );
  const tonnage = workout.exercises.reduce(
    (n, e) =>
      n +
      e.sets
        .filter((s) => !s.isWarmup && s.completed)
        .reduce((m, s) => m + s.weight * s.reps, 0),
    0,
  );
  const canFinish = completedSetCount > 0;
  const progressPct =
    totalNonWarm === 0 ? 0 : Math.round((100 * completedSetCount) / totalNonWarm);

  function handleFinish() {
    if (!workout) return;
    if (!window.confirm('Finish this workout?')) return;
    actions.finishWorkout(workout.id);
    navigate('/');
  }

  return (
    <div className="route mx-auto max-w-md pb-32">
      <header className="glass-bar sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2.5">
        <Link
          to="/"
          className="btn-ghost-accent -ml-1 flex min-h-11 items-center px-2 text-[14px] font-medium"
        >
          <span aria-hidden="true" className="mr-0.5 text-[18px] leading-none">
            ‹
          </span>
          Home
        </Link>
        <div className="min-w-0 flex-1 text-center">
          <input
            type="date"
            value={isoToLocalDateInput(workout.date)}
            onChange={(e) =>
              actions.updateWorkoutDate(workout.id, dateInputToIso(e.target.value, workout.date))
            }
            aria-label="Workout date"
            className="text-strong mx-auto block min-h-9 rounded-lg border border-transparent bg-transparent px-2 text-center text-[13px] font-semibold tabular-nums tracking-tight transition-colors hover:border-[var(--hairline)] focus:border-[var(--color-accent-500)] focus:outline-none"
          />
          <div className="mt-0.5 flex items-center justify-center gap-1.5">
            <label className="relative inline-flex">
              <select
                value={workout.type ?? ''}
                onChange={(e) =>
                  actions.updateWorkoutType(
                    workout.id,
                    (e.target.value || undefined) as WorkoutType | undefined,
                  )
                }
                aria-label="Workout type"
                className={`appearance-none rounded-full border px-2.5 py-0.5 text-[11px] font-semibold leading-tight focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-500)]/40 ${
                  workout.type
                    ? workoutTypePillClasses(workout.type)
                    : 'border-dashed border-[var(--hairline)] bg-transparent text-[var(--text-faint)]'
                }`}
              >
                <option value="">+ Type</option>
                {WORKOUT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {workoutTypeLabel(t)}
                  </option>
                ))}
              </select>
            </label>
            {isComplete && (
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                ✓ Complete
              </span>
            )}
          </div>
        </div>
        {isComplete ? (
          <span className="min-w-11" />
        ) : (
          <button
            type="button"
            onClick={handleFinish}
            disabled={!canFinish}
            className="btn-accent min-h-9 rounded-full px-3.5 text-[13px] font-semibold tracking-tight"
          >
            Finish
          </button>
        )}
      </header>

      {!isComplete && (
        <div className="px-3.5 pt-2">
          <div className="glass-quiet flex items-center gap-2.5 rounded-full px-3 py-1.5">
            <span className="num-mono text-faint text-[10px] tracking-[0.06em]">
              {String(completedSetCount).padStart(2, '0')}/
              {String(totalNonWarm).padStart(2, '0')}
            </span>
            <div className="rail flex-1" style={{ height: 4 }}>
              <i
                style={{
                  width: `${progressPct}%`,
                  background: 'var(--color-accent-500)',
                  transition: 'width 400ms var(--ease-spring)',
                }}
              />
            </div>
            <span className="num-mono text-strong text-[10px] tracking-[0.06em]">
              {formatTonnage(tonnage)}
              <span className="text-faint ml-0.5">lbs</span>
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 px-3 py-4">
        {workout.exercises.length === 0 && (
          <div className="glass-quiet rounded-2xl px-4 py-10 text-center">
            <p className="text-muted text-sm">No exercises yet.</p>
            <p className="text-faint mt-1 text-xs">
              Tap + Add Exercise to start.
            </p>
          </div>
        )}

        {workout.exercises.map((exercise, idx) => (
          <ExerciseCard
            key={exercise.id}
            workoutId={workout.id}
            exercise={exercise}
            readOnly={isComplete}
            index={idx + 1}
          />
        ))}

        {!isComplete && (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="btn-glass anim-slide min-h-12 w-full rounded-2xl text-[14px] font-semibold tracking-tight text-[var(--color-accent-600)] dark:text-[var(--color-accent-300)]"
          >
            <span aria-hidden="true" className="mr-1 text-[16px] leading-none">
              +
            </span>
            Add Exercise
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
