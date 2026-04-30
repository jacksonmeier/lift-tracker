import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Exercise, WorkoutSet } from '../types';
import NumericField from './NumericField';
import TickCheckbox from './TickCheckbox';
import Spark from './Spark';

interface Props {
  workoutId: string;
  exercise: Exercise;
  readOnly?: boolean;
  index?: number;
}

export default function ExerciseCard({
  workoutId,
  exercise,
  readOnly = false,
  index,
}: Props) {
  const { state, actions } = useApp();
  const lift = state.lifts.find((l) => l.id === exercise.liftId);
  const liftName = lift?.name ?? 'Unknown lift';
  const [sparkSetId, setSparkSetId] = useState<string | null>(null);

  const gridCols = readOnly
    ? '1.25rem 1fr 1fr 2.75rem 2.75rem'
    : '1.25rem 1fr 1fr 2.75rem 2.75rem 1.75rem';

  const prevBest = useMemo(() => {
    let best = 0;
    for (const w of state.workouts) {
      if (w.id === workoutId) continue;
      for (const e of w.exercises) {
        if (e.liftId !== exercise.liftId) continue;
        for (const s of e.sets) {
          if (!s.isWarmup && s.completed && s.weight > best) best = s.weight;
        }
      }
    }
    return best;
  }, [state.workouts, workoutId, exercise.liftId]);

  function update(set: WorkoutSet) {
    actions.updateSet(workoutId, exercise.id, set);
  }

  function handleToggleComplete(set: WorkoutSet, next: boolean) {
    update({ ...set, completed: next });
    if (next && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setSparkSetId(set.id);
      window.setTimeout(() => setSparkSetId(null), 600);
    }
  }

  function handleRemoveExercise() {
    if (!window.confirm(`Remove ${liftName} from this workout?`)) return;
    actions.removeExercise(workoutId, exercise.id);
  }

  function handleDeleteSet(set: WorkoutSet, i: number) {
    if (set.completed) {
      if (!window.confirm(`Delete set ${i + 1}?`)) return;
    }
    actions.deleteSet(workoutId, exercise.id, set.id);
  }

  return (
    <section className="glass anim-slide overflow-hidden rounded-2xl">
      <header className="flex items-center gap-2.5 border-b border-[var(--hairline-soft)] px-3.5 py-2.5">
        {typeof index === 'number' && (
          <span className="num-mono text-faint w-5 shrink-0 text-[10px] tracking-[0.08em]">
            {String(index).padStart(2, '0')}
          </span>
        )}
        <h3 className="text-strong min-w-0 flex-1 truncate text-[15px] font-semibold tracking-tight">
          {liftName}
        </h3>
        {lift?.category && (
          <span className="num-mono text-faint hidden shrink-0 text-[9px] uppercase tracking-[0.12em] sm:inline">
            {lift.category}
          </span>
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={handleRemoveExercise}
            className="-mr-2 min-h-9 px-2 text-[12px] font-medium text-red-500/90 transition-colors hover:text-red-500"
            aria-label={`Remove ${liftName}`}
          >
            Remove
          </button>
        )}
      </header>

      <div className="px-2.5 pb-2.5 pt-2">
        <div
          className="num-mono text-faint grid items-center gap-1.5 px-1 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.12em]"
          style={{ gridTemplateColumns: gridCols }}
        >
          <span>Set</span>
          <span className="text-center">lbs</span>
          <span className="text-center">reps</span>
          <span className="text-center">warm</span>
          <span className="text-center">✓</span>
          {!readOnly && <span />}
        </div>

        {exercise.sets.length === 0 && (
          <p className="text-muted px-1 py-2 text-sm">No sets yet.</p>
        )}

        {exercise.sets.map((set, i) => {
          const isPR =
            !set.isWarmup && set.completed && prevBest > 0 && set.weight > prevBest;
          const isBest =
            !set.isWarmup && set.completed && prevBest > 0 && set.weight === prevBest;
          return (
            <div
              key={set.id}
              className={`set-row spark-host ${set.isWarmup ? 'warmup' : ''} ${
                isPR ? 'pr' : set.completed ? 'completed' : ''
              }`}
              style={{ gridTemplateColumns: gridCols }}
            >
              <span className="num-mono text-faint text-center text-[11px]">
                {i + 1}
              </span>
              <NumericField
                value={set.weight}
                onChange={(weight) => update({ ...set, weight })}
                inputMode="decimal"
                ariaLabel={`Set ${i + 1} weight`}
                disabled={readOnly}
                className="glass-input min-h-11 w-full rounded-lg px-2 text-center text-[15px] tabular-nums"
              />
              <NumericField
                value={set.reps}
                onChange={(reps) => update({ ...set, reps })}
                inputMode="numeric"
                ariaLabel={`Set ${i + 1} reps`}
                disabled={readOnly}
                className="glass-input min-h-11 w-full rounded-lg px-2 text-center text-[15px] tabular-nums"
              />
              <div className="flex justify-center">
                <TickCheckbox
                  kind="warm"
                  checked={set.isWarmup}
                  disabled={readOnly}
                  onChange={(v) => update({ ...set, isWarmup: v })}
                  ariaLabel={`Set ${i + 1} warmup`}
                />
              </div>
              <div className="flex justify-center">
                <TickCheckbox
                  checked={set.completed}
                  disabled={readOnly}
                  onChange={(v) => handleToggleComplete(set, v)}
                  ariaLabel={`Set ${i + 1} done`}
                />
              </div>
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
              {(isPR || isBest) && (
                <span className={`best-tag ${isBest && !isPR ? 'muted' : ''}`}>
                  {isPR ? '★ PR' : 'BEST'}
                </span>
              )}
              {sparkSetId === set.id && <Spark count={10} />}
            </div>
          );
        })}

        {!readOnly && (
          <button
            type="button"
            onClick={() => actions.addSet(workoutId, exercise.id)}
            className="mt-2 min-h-11 w-full rounded-xl border border-dashed border-[var(--hairline-strong)] text-[13px] font-medium text-[var(--color-accent-600)] transition-colors hover:bg-white/40 active:bg-white/55 dark:text-[var(--color-accent-300)] dark:hover:bg-white/5"
          >
            + Add Set
          </button>
        )}
      </div>
    </section>
  );
}
