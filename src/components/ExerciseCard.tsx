import { useApp } from '../context/AppContext';
import type { Exercise, WorkoutSet } from '../types';
import NumericField from './NumericField';

interface Props {
  workoutId: string;
  exercise: Exercise;
  readOnly?: boolean;
}

export default function ExerciseCard({ workoutId, exercise, readOnly = false }: Props) {
  const { state, actions } = useApp();
  const lift = state.lifts.find((l) => l.id === exercise.liftId);
  const liftName = lift?.name ?? 'Unknown lift';

  const gridCols = readOnly
    ? '1.5rem 1fr 1fr 2.5rem 2.5rem'
    : '1.5rem 1fr 1fr 2.5rem 2.5rem 1.75rem';

  function update(set: WorkoutSet) {
    actions.updateSet(workoutId, exercise.id, set);
  }

  function handleRemoveExercise() {
    if (!window.confirm(`Remove ${liftName} from this workout?`)) return;
    actions.removeExercise(workoutId, exercise.id);
  }

  function handleDeleteSet(set: WorkoutSet, index: number) {
    if (set.completed) {
      if (!window.confirm(`Delete set ${index + 1}?`)) return;
    }
    actions.deleteSet(workoutId, exercise.id, set.id);
  }

  return (
    <section className="rounded-lg border border-gray-200 bg-white">
      <header className="flex items-center justify-between gap-2 border-b border-gray-200 px-3 py-2">
        <h3 className="truncate text-base font-semibold">{liftName}</h3>
        {!readOnly && (
          <button
            type="button"
            onClick={handleRemoveExercise}
            className="min-h-11 px-2 -mr-2 text-sm text-red-600"
            aria-label={`Remove ${liftName}`}
          >
            Remove
          </button>
        )}
      </header>

      <div className="px-2 py-2">
        <div
          className="grid items-center gap-1 px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-500"
          style={{ gridTemplateColumns: gridCols }}
        >
          <span>#</span>
          <span>Weight</span>
          <span>Reps</span>
          <span className="text-center">Warm</span>
          <span className="text-center">Done</span>
          {!readOnly && <span />}
        </div>

        {exercise.sets.length === 0 && (
          <p className="px-1 py-2 text-sm text-gray-500">No sets yet.</p>
        )}

        {exercise.sets.map((set, i) => (
          <div
            key={set.id}
            className={`grid items-center gap-1 rounded px-1 py-1 ${
              set.isWarmup ? 'bg-gray-50 text-gray-500' : ''
            } ${set.completed ? 'bg-green-50' : ''}`}
            style={{ gridTemplateColumns: gridCols }}
          >
            <span className="text-sm tabular-nums">{i + 1}</span>
            <NumericField
              value={set.weight}
              onChange={(weight) => update({ ...set, weight })}
              inputMode="decimal"
              ariaLabel={`Set ${i + 1} weight`}
              disabled={readOnly}
              className="min-h-11 w-full rounded border border-gray-300 bg-white px-2 text-base tabular-nums focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
            <NumericField
              value={set.reps}
              onChange={(reps) => update({ ...set, reps })}
              inputMode="numeric"
              ariaLabel={`Set ${i + 1} reps`}
              disabled={readOnly}
              className="min-h-11 w-full rounded border border-gray-300 bg-white px-2 text-base tabular-nums focus:border-blue-500 focus:outline-none disabled:bg-gray-100"
            />
            <label className="flex h-11 items-center justify-center">
              <span className="sr-only">Warmup</span>
              <input
                type="checkbox"
                checked={set.isWarmup}
                disabled={readOnly}
                onChange={(e) => update({ ...set, isWarmup: e.target.checked })}
                className="h-5 w-5"
                aria-label={`Set ${i + 1} warmup`}
              />
            </label>
            <label className="flex h-11 items-center justify-center">
              <span className="sr-only">Completed</span>
              <input
                type="checkbox"
                checked={set.completed}
                disabled={readOnly}
                onChange={(e) => update({ ...set, completed: e.target.checked })}
                className="h-6 w-6"
                aria-label={`Set ${i + 1} done`}
              />
            </label>
            {!readOnly && (
              <button
                type="button"
                onClick={() => handleDeleteSet(set, i)}
                className="flex h-11 items-center justify-center text-lg leading-none text-gray-400 hover:text-red-600"
                aria-label={`Delete set ${i + 1}`}
              >
                ×
              </button>
            )}
          </div>
        ))}

        {!readOnly && (
          <button
            type="button"
            onClick={() => actions.addSet(workoutId, exercise.id)}
            className="mt-2 min-h-11 w-full rounded border border-dashed border-gray-300 text-base text-blue-600 hover:bg-gray-50"
          >
            + Add Set
          </button>
        )}
      </div>
    </section>
  );
}
