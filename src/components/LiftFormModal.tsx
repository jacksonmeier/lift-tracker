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
          {isEdit ? 'Edit Lift' : 'New Lift'}
        </h2>
        <button
          type="submit"
          form="lift-form"
          disabled={!name.trim()}
          className="btn-ghost-accent -mr-1 min-h-11 px-2 text-[15px] font-semibold disabled:text-[var(--text-faint)] disabled:opacity-60"
        >
          Save
        </button>
      </header>

      <form
        id="lift-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 px-4 pt-5"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-faint px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            placeholder="e.g. Bench Press"
            className="glass-input min-h-12 rounded-xl px-3.5 text-[15px]"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-faint px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Category
          </span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as LiftCategory)}
            className="glass-input min-h-12 rounded-xl px-3.5 text-[15px] capitalize"
          >
            {LIFT_CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-faint px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Notes (optional)
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Cue, grip width, etc."
            className="glass-input rounded-xl px-3.5 py-2.5 text-[15px]"
          />
        </label>
      </form>
    </div>
  );
}
