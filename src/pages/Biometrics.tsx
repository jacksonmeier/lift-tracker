import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { BiometricEntry } from '../types';
import BiometricFormModal from '../components/BiometricFormModal';

type Editing = { kind: 'new' } | { kind: 'edit'; entry: BiometricEntry } | null;

function formatRowDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function formatNumber(n: number, decimals = 0): string {
  if (decimals > 0 && !Number.isInteger(n)) return n.toFixed(decimals);
  return Math.round(n).toLocaleString();
}

interface MetricPillProps {
  value: string;
  unit: string;
}

function MetricPill({ value, unit }: MetricPillProps) {
  return (
    <span className="inline-flex items-baseline gap-0.5">
      <span className="text-strong num font-semibold">{value}</span>
      <span className="text-faint text-[11px]">{unit}</span>
    </span>
  );
}

function entryHasMetrics(e: BiometricEntry): boolean {
  return (
    (e.weight ?? 0) > 0 ||
    (e.heartRate ?? 0) > 0 ||
    (e.caloriesBurned ?? 0) > 0 ||
    (e.workoutLengthMin ?? 0) > 0
  );
}

export default function Biometrics() {
  const { state, actions } = useApp();
  const [editing, setEditing] = useState<Editing>(null);

  const sorted = useMemo(
    () =>
      state.biometrics.slice().sort((a, b) => b.date.localeCompare(a.date)),
    [state.biometrics],
  );

  function handleDelete(entry: BiometricEntry) {
    if (
      !window.confirm(
        `Delete entry from ${formatRowDate(entry.date)}? This can't be undone.`,
      )
    ) {
      return;
    }
    actions.deleteBiometric(entry.id);
  }

  return (
    <div className="route mx-auto max-w-md pb-24">
      <header className="glass-bar sticky top-3 z-20 mx-3 mt-3 flex items-center justify-between gap-2 rounded-2xl px-3 py-2.5">
        <Link
          to="/"
          className="btn-ghost-accent -ml-1 flex min-h-11 items-center px-2 text-[14px] font-medium"
        >
          <span aria-hidden="true" className="mr-0.5 text-[18px] leading-none">
            ‹
          </span>
          Home
        </Link>
        <h1 className="text-strong text-[15px] font-semibold tracking-tight">Biometrics</h1>
        <button
          type="button"
          onClick={() => setEditing({ kind: 'new' })}
          className="btn-ghost-accent -mr-1 min-h-11 px-2 text-[14px] font-semibold"
        >
          + Log
        </button>
      </header>

      {sorted.length === 0 ? (
        <div className="px-4 pt-8">
          <div className="glass rounded-2xl px-6 py-12 text-center">
            <p className="text-strong text-[15px] font-medium">No entries yet.</p>
            <p className="text-muted mt-1 text-[13px]">
              Tap + Log to record your weight or workout stats.
            </p>
          </div>
        </div>
      ) : (
        <div className="px-4 pt-4">
          <ul className="glass divide-y divide-[var(--hairline-soft)] overflow-hidden rounded-2xl">
            {sorted.map((entry) => (
              <li key={entry.id} className="flex items-stretch">
                <button
                  type="button"
                  onClick={() => setEditing({ kind: 'edit', entry })}
                  className="flex min-w-0 flex-1 flex-col gap-1 px-3.5 py-3 text-left transition-colors active:bg-white/40 dark:active:bg-white/5"
                >
                  <span className="text-strong text-[14px] font-medium tracking-tight">
                    {formatRowDate(entry.date)}
                  </span>
                  {entryHasMetrics(entry) ? (
                    <span className="text-muted flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13px]">
                      {entry.weight && entry.weight > 0 && (
                        <MetricPill value={formatNumber(entry.weight, 1)} unit="lbs" />
                      )}
                      {entry.heartRate && entry.heartRate > 0 && (
                        <MetricPill value={formatNumber(entry.heartRate)} unit="bpm" />
                      )}
                      {entry.caloriesBurned && entry.caloriesBurned > 0 && (
                        <MetricPill value={formatNumber(entry.caloriesBurned)} unit="kcal" />
                      )}
                      {entry.workoutLengthMin && entry.workoutLengthMin > 0 && (
                        <MetricPill value={formatNumber(entry.workoutLengthMin)} unit="min" />
                      )}
                    </span>
                  ) : (
                    <span className="text-faint text-[12px]">No metrics</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(entry)}
                  className="text-faint flex min-h-11 min-w-11 items-center justify-center px-2 text-xl leading-none transition-colors hover:text-red-500"
                  aria-label={`Delete entry from ${formatRowDate(entry.date)}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && (
        <BiometricFormModal
          initial={editing.kind === 'edit' ? editing.entry : undefined}
          onCancel={() => setEditing(null)}
          onSubmit={(values) => {
            if (editing.kind === 'edit') {
              // Replace fully — clearing a field in the form should remove it.
              actions.updateBiometric({ id: editing.entry.id, ...values });
            } else {
              actions.addBiometric(values);
            }
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
