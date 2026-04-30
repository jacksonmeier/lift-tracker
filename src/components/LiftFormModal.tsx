import { useEffect, useState } from 'react';
import { LIFT_CATEGORIES, type Lift, type LiftCategory } from '../types';

interface Props {
  initial?: Lift;
  onCancel: () => void;
  onSubmit: (values: { name: string; category: LiftCategory; notes?: string }) => void;
}

export default function LiftFormModal({ initial, onCancel, onSubmit }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState<LiftCategory>(initial?.category ?? 'push');
  const [notes, setNotes] = useState(initial?.notes ?? '');

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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      category,
      notes: notes.trim() ? notes.trim() : undefined,
    });
  }

  const isEdit = Boolean(initial);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white">
      <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 px-2 text-base text-blue-600"
        >
          Cancel
        </button>
        <h2 className="text-lg font-semibold">{isEdit ? 'Edit Lift' : 'New Lift'}</h2>
        <button
          type="submit"
          form="lift-form"
          disabled={!name.trim()}
          className="min-h-11 px-2 text-base font-semibold text-blue-600 disabled:text-gray-300"
        >
          Save
        </button>
      </header>

      <form id="lift-form" onSubmit={handleSubmit} className="flex flex-col gap-4 p-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Name</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="e.g. Bench Press"
            className="min-h-11 rounded-md border border-gray-300 px-3 text-base focus:border-blue-500 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as LiftCategory)}
            className="min-h-11 rounded-md border border-gray-300 bg-white px-3 text-base capitalize focus:border-blue-500 focus:outline-none"
          >
            {LIFT_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-gray-700">Notes (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Cue, grip width, etc."
            className="rounded-md border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
          />
        </label>
      </form>
    </div>
  );
}
