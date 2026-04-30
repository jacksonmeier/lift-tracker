import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LiftFormModal from '../components/LiftFormModal';
import { LIFT_CATEGORIES, type AppState, type Lift, type LiftCategory } from '../types';

type Editing = { kind: 'new' } | { kind: 'edit'; lift: Lift } | null;

const CATEGORY_DOT: Record<LiftCategory, string> = {
  push: 'rgb(14 165 233)',
  pull: 'rgb(139 92 246)',
  legs: 'rgb(244 63 94)',
  core: 'var(--color-accent-500)',
  other: 'var(--text-faint)',
};

function isLiftUsed(state: AppState, liftId: string): boolean {
  return state.workouts.some((w) => w.exercises.some((e) => e.liftId === liftId));
}

export default function Lifts() {
  const { state, actions } = useApp();
  const [editing, setEditing] = useState<Editing>(null);

  const grouped = useMemo(() => {
    const byCategory: Record<LiftCategory, Lift[]> = {
      push: [],
      pull: [],
      legs: [],
      core: [],
      other: [],
    };
    for (const lift of state.lifts) {
      byCategory[lift.category].push(lift);
    }
    for (const c of LIFT_CATEGORIES) {
      byCategory[c].sort((a, b) => a.name.localeCompare(b.name));
    }
    return byCategory;
  }, [state.lifts]);

  function handleDelete(lift: Lift) {
    if (isLiftUsed(state, lift.id)) {
      const ok = window.confirm(
        `"${lift.name}" appears in past workouts. Delete it anyway? Past workout history will keep the data but the lift will no longer be selectable.`,
      );
      if (!ok) return;
    }
    actions.deleteLift(lift.id);
  }

  return (
    <div className="route mx-auto max-w-md pb-24">
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
        <h1 className="text-strong text-[15px] font-semibold tracking-tight">Lifts</h1>
        <button
          type="button"
          onClick={() => setEditing({ kind: 'new' })}
          className="btn-ghost-accent -mr-1 min-h-11 px-2 text-[14px] font-semibold"
        >
          + Add
        </button>
      </header>

      {state.lifts.length === 0 ? (
        <div className="px-4 pt-8">
          <div className="glass rounded-2xl px-6 py-12 text-center">
            <p className="text-strong text-[15px] font-medium">No lifts yet.</p>
            <p className="text-muted mt-1 text-[13px]">
              Tap + Add to create your first one.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-2">
          {LIFT_CATEGORIES.map((category) => {
            const lifts = grouped[category];
            if (lifts.length === 0) return null;
            return (
              <section key={category} className="mt-6 first:mt-4">
                <h2 className="section-label mb-2 flex items-center gap-2 px-1">
                  <span
                    className="dot"
                    style={{ background: CATEGORY_DOT[category] }}
                  />
                  <span>{category}</span>
                  <span className="num-mono ml-auto text-[10px] tracking-[0.06em]">
                    {String(lifts.length).padStart(2, '0')}
                  </span>
                </h2>
                <ul className="glass divide-y divide-[var(--hairline-soft)] overflow-hidden rounded-2xl">
                  {lifts.map((lift) => (
                    <li key={lift.id} className="flex items-start gap-2 px-4 py-2.5">
                      <div className="min-w-0 flex-1 py-1">
                        <div className="text-strong text-[15px] font-medium tracking-tight">
                          {lift.name}
                        </div>
                        {lift.notes && (
                          <div className="text-muted mt-0.5 text-[13px]">{lift.notes}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing({ kind: 'edit', lift })}
                        className="btn-ghost-accent min-h-11 min-w-11 px-2 text-[14px]"
                        aria-label={`Edit ${lift.name}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lift)}
                        className="min-h-11 min-w-11 px-2 text-[14px] text-red-500/90 transition-colors hover:text-red-500 active:opacity-70"
                        aria-label={`Delete ${lift.name}`}
                      >
                        Delete
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {editing && (
        <LiftFormModal
          initial={editing.kind === 'edit' ? editing.lift : undefined}
          onCancel={() => setEditing(null)}
          onSubmit={(values) => {
            if (editing.kind === 'edit') {
              actions.updateLift({ ...editing.lift, ...values });
            } else {
              actions.addLift(values);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
