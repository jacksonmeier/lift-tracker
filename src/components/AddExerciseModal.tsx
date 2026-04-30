import { useEffect, useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { LIFT_CATEGORIES, type LiftCategory } from '../types';

interface Props {
  onCancel: () => void;
  onSelect: (liftId: string) => void;
}

export default function AddExerciseModal({ onCancel, onSelect }: Props) {
  const { state, actions } = useApp();
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<LiftCategory>('push');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onCancel]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? state.lifts.filter((l) => l.name.toLowerCase().includes(q))
      : state.lifts.slice();
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [state.lifts, query]);

  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const lift = actions.addLift({ name: trimmed, category: newCategory });
    onSelect(lift.id);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background:
          'radial-gradient(120% 80% at 0% 0%, var(--bg-grad-1) 0%, transparent 55%),' +
          'radial-gradient(120% 80% at 100% 0%, var(--bg-grad-2) 0%, transparent 55%),' +
          'linear-gradient(180deg, var(--bg-grad-3) 0%, var(--bg-grad-4) 100%)',
      }}
    >
      <header className="glass-bar flex items-center justify-between gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={onCancel}
          className="btn-ghost-accent -ml-1 min-h-11 px-2 text-[15px]"
        >
          Cancel
        </button>
        <h2 className="text-strong text-[17px] font-semibold tracking-tight">
          Add Exercise
        </h2>
        <span className="min-w-11" />
      </header>

      <div className="px-4 pt-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lifts"
          autoFocus
          className="glass-input min-h-12 w-full rounded-xl px-3.5 text-[15px]"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-3">
        {filtered.length === 0 ? (
          <div className="glass-quiet rounded-2xl px-4 py-8 text-center">
            <p className="text-muted text-[13px]">
              {state.lifts.length === 0 ? 'No lifts yet.' : 'No matches.'}
            </p>
          </div>
        ) : (
          <ul className="glass divide-y divide-[var(--hairline-soft)] overflow-hidden rounded-2xl">
            {filtered.map((lift) => (
              <li key={lift.id}>
                <button
                  type="button"
                  onClick={() => onSelect(lift.id)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors active:bg-white/40 dark:active:bg-white/5"
                >
                  <span className="text-strong truncate text-[15px] font-medium tracking-tight">
                    {lift.name}
                  </span>
                  <span className="text-faint shrink-0 text-[10px] font-semibold uppercase tracking-[0.12em]">
                    {lift.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 pb-[max(env(safe-area-inset-bottom),1rem)] pt-3">
        {creating ? (
          <div className="glass flex flex-col gap-2 rounded-2xl p-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New lift name"
              autoFocus
              className="glass-input min-h-11 rounded-xl px-3 text-[15px]"
            />
            <div className="flex gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as LiftCategory)}
                className="glass-input min-h-11 flex-1 rounded-xl px-3 text-[15px] capitalize"
              >
                {LIFT_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  setNewName('');
                }}
                className="text-muted min-h-11 px-3 text-[15px] active:opacity-70"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="btn-accent min-h-11 rounded-xl px-4 text-[15px] font-semibold tracking-tight"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="btn-glass min-h-12 w-full rounded-2xl text-[15px] font-semibold tracking-tight text-[var(--color-accent-600)] dark:text-[var(--color-accent-300)]"
          >
            + Create new lift
          </button>
        )}
      </div>
    </div>
  );
}
