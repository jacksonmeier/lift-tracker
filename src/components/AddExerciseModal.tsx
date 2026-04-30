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
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 px-2 -ml-2 text-base text-blue-600"
        >
          Cancel
        </button>
        <h2 className="text-lg font-semibold">Add Exercise</h2>
        <span className="min-w-11" />
      </header>

      <div className="border-b border-gray-200 p-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search lifts"
          autoFocus
          className="min-h-11 w-full rounded-md border border-gray-300 px-3 text-base focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-gray-500">
            {state.lifts.length === 0 ? 'No lifts yet.' : 'No matches.'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filtered.map((lift) => (
              <li key={lift.id}>
                <button
                  type="button"
                  onClick={() => onSelect(lift.id)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left hover:bg-gray-50"
                >
                  <span className="truncate text-base">{lift.name}</span>
                  <span className="text-xs uppercase tracking-wide text-gray-500">
                    {lift.category}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-gray-200 bg-gray-50 p-3">
        {creating ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New lift name"
              autoFocus
              className="min-h-11 rounded-md border border-gray-300 bg-white px-3 text-base focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as LiftCategory)}
                className="min-h-11 flex-1 rounded-md border border-gray-300 bg-white px-3 text-base capitalize focus:border-blue-500 focus:outline-none"
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
                className="min-h-11 px-3 text-base text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="min-h-11 rounded-md bg-blue-600 px-4 text-base font-semibold text-white disabled:bg-gray-300"
              >
                Create
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="min-h-11 w-full text-base font-semibold text-blue-600"
          >
            + Create new lift
          </button>
        )}
      </div>
    </div>
  );
}
