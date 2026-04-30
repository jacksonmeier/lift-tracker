import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import LiftFormModal from '../components/LiftFormModal';
import { LIFT_CATEGORIES, type AppState, type Lift, type LiftCategory } from '../types';

type Editing = { kind: 'new' } | { kind: 'edit'; lift: Lift } | null;

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
    <div className="mx-auto max-w-md pb-24">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Link to="/" className="min-h-11 px-2 -ml-2 text-base text-blue-600 flex items-center">
          ← Home
        </Link>
        <h1 className="text-lg font-semibold">Lifts</h1>
        <button
          type="button"
          onClick={() => setEditing({ kind: 'new' })}
          className="min-h-11 px-2 -mr-2 text-base font-semibold text-blue-600"
        >
          + Add
        </button>
      </header>

      {state.lifts.length === 0 ? (
        <div className="px-4 py-12 text-center text-gray-500">
          <p>No lifts yet.</p>
          <p className="mt-2 text-sm">Tap + Add to create your first one.</p>
        </div>
      ) : (
        <div className="px-4">
          {LIFT_CATEGORIES.map((category) => {
            const lifts = grouped[category];
            if (lifts.length === 0) return null;
            return (
              <section key={category} className="mt-6 first:mt-4">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {category}
                </h2>
                <ul className="mt-2 divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white">
                  {lifts.map((lift) => (
                    <li key={lift.id} className="flex items-start gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1 py-1">
                        <div className="font-medium">{lift.name}</div>
                        {lift.notes && (
                          <div className="mt-0.5 text-sm text-gray-500">{lift.notes}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setEditing({ kind: 'edit', lift })}
                        className="min-h-11 min-w-11 px-2 text-sm text-blue-600"
                        aria-label={`Edit ${lift.name}`}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(lift)}
                        className="min-h-11 min-w-11 px-2 text-sm text-red-600"
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
