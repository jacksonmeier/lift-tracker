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
    <section className="glass overflow-hidden rounded-2xl">
      <header className="flex items-center justify-between gap-2 border-b border-[var(--hairline-soft)] px-4 py-2.5">
        <h3 className="text-strong truncate text-[16px] font-semibold tracking-tight">
          {liftName}
        </h3>
        {lift?.category && (
          <span className="text-faint hidden shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em] sm:inline">
            {lift.category}
          </span>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={handleRemoveExercise}
            className="btn-ghost-accent -mr-2 min-h-11 px-2 text-[13px] text-red-500/90 hover:text-red-500"
            aria-label={`Remove ${liftName}`}
          >
            Remove
          </button>
        )}
      </header>

      <div className="px-2.5 pb-2.5 pt-2">
        <div
          className="text-faint grid items-center gap-1 px-1 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em]"
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
          <p className="text-muted px-1 py-2 text-sm">No sets yet.</p>
        )}

        {exercise.sets.map((set, i) => (
          <div
            key={set.id}
            className={`grid items-center gap-1 rounded-xl px-1.5 py-1 transition-colors ${
              set.isWarmup ? 'opacity-60' : ''
            } ${
              set.completed
                ? 'bg-emerald-400/12 ring-1 ring-inset ring-emerald-400/25'
                : ''
            }`}
            style={{ gridTemplateColumns: gridCols }}
          >
            <span className="text-muted text-[13px] tabular-nums">{i + 1}</span>
            <NumericField
              value={set.weight}
              onChange={(weight) => update({ ...set, weight })}
              inputMode="decimal"
              ariaLabel={`Set ${i + 1} weight`}
              disabled={readOnly}
              className="glass-input min-h-11 w-full rounded-lg px-2 text-[15px] tabular-nums"
            />
            <NumericField
              value={set.reps}
              onChange={(reps) => update({ ...set, reps })}
              inputMode="numeric"
              ariaLabel={`Set ${i + 1} reps`}
              disabled={readOnly}
              className="glass-input min-h-11 w-full rounded-lg px-2 text-[15px] tabular-nums"
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
                className="text-faint flex h-11 items-center justify-center text-lg leading-none transition-colors hover:text-red-500"
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
            className="mt-2 min-h-11 w-full rounded-xl border border-dashed border-[var(--hairline)] text-[14px] font-medium text-[var(--color-accent-600)] transition-colors hover:bg-white/40 active:bg-white/55 dark:text-[var(--color-accent-300)] dark:hover:bg-white/5"
          >
            + Add Set
          </button>
        )}
      </div>
    </section>
  );
}
