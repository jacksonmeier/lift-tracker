import { useEffect, useState } from 'react';
import type { BiometricEntry } from '../types';
import { dateInputToIso, isoToLocalDateInput } from '../lib/dates';
import NumericField from './NumericField';

export type BiometricFormValues = Omit<BiometricEntry, 'id'>;

interface Props {
  initial?: BiometricEntry;
  onCancel: () => void;
  onSubmit: (values: BiometricFormValues) => void;
}

export default function BiometricFormModal({ initial, onCancel, onSubmit }: Props) {
  const initialIso = initial?.date ?? new Date().toISOString();
  const [dateInput, setDateInput] = useState(() => isoToLocalDateInput(initialIso));
  const [weight, setWeight] = useState(initial?.weight ?? 0);
  const [heartRate, setHeartRate] = useState(initial?.heartRate ?? 0);
  const [calories, setCalories] = useState(initial?.caloriesBurned ?? 0);
  const [length, setLength] = useState(initial?.workoutLengthMin ?? 0);

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

  const hasAny = weight > 0 || heartRate > 0 || calories > 0 || length > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!hasAny) return;
    onSubmit({
      date: dateInputToIso(dateInput, initialIso),
      ...(weight > 0 ? { weight } : {}),
      ...(heartRate > 0 ? { heartRate } : {}),
      ...(calories > 0 ? { caloriesBurned: calories } : {}),
      ...(length > 0 ? { workoutLengthMin: length } : {}),
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
          {isEdit ? 'Edit Entry' : 'New Entry'}
        </h2>
        <button
          type="submit"
          form="biometric-form"
          disabled={!hasAny}
          className="btn-ghost-accent -mr-1 min-h-11 px-2 text-[15px] font-semibold disabled:text-[var(--text-faint)] disabled:opacity-60"
        >
          Save
        </button>
      </header>

      <form
        id="biometric-form"
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 px-4 pt-5"
      >
        <label className="flex flex-col gap-1.5">
          <span className="text-faint px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Date
          </span>
          <input
            type="date"
            value={dateInput}
            onChange={(e) => setDateInput(e.target.value)}
            className="glass-input min-h-12 rounded-xl px-3.5 text-[15px]"
          />
        </label>

        <Field label="Weight" unit="lbs">
          <NumericField
            value={weight}
            onChange={setWeight}
            inputMode="decimal"
            ariaLabel="Weight in pounds"
            className="glass-input min-h-12 w-full rounded-xl px-3.5 text-right text-[15px] num"
          />
        </Field>

        <Field label="Heart rate" unit="bpm">
          <NumericField
            value={heartRate}
            onChange={setHeartRate}
            inputMode="numeric"
            ariaLabel="Average heart rate during workout in BPM"
            className="glass-input min-h-12 w-full rounded-xl px-3.5 text-right text-[15px] num"
          />
        </Field>

        <Field label="Calories burned" unit="kcal">
          <NumericField
            value={calories}
            onChange={setCalories}
            inputMode="numeric"
            ariaLabel="Calories burned"
            className="glass-input min-h-12 w-full rounded-xl px-3.5 text-right text-[15px] num"
          />
        </Field>

        <Field label="Workout length" unit="min">
          <NumericField
            value={length}
            onChange={setLength}
            inputMode="numeric"
            ariaLabel="Workout length in minutes"
            className="glass-input min-h-12 w-full rounded-xl px-3.5 text-right text-[15px] num"
          />
        </Field>

        <p className="text-faint px-1 text-[12px]">
          Leave any field blank to skip it.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  unit,
  children,
}: {
  label: string;
  unit: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-faint flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
        <span>{label}</span>
        <span className="text-faint/80 font-medium normal-case tracking-normal">
          {unit}
        </span>
      </span>
      {children}
    </label>
  );
}
