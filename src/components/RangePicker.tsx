import { useEffect, useState } from 'react';
import {
  RANGE_UNITS,
  RANGE_UNIT_BOUNDS,
  clampAmount,
  defaultAmount,
  type Range,
  type RangeUnit,
} from '../lib/range';

interface Props {
  value: Range;
  onChange: (range: Range) => void;
}

const UNIT_LABELS: Record<RangeUnit, string> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
  all: 'All time',
};

export default function RangePicker({ value, onChange }: Props) {
  const [draft, setDraft] = useState(() => String(value.amount));

  useEffect(() => {
    setDraft(String(value.amount));
  }, [value.unit, value.amount]);

  function selectUnit(unit: RangeUnit) {
    if (unit === value.unit) return;
    onChange({ unit, amount: defaultAmount(unit) });
  }

  function commit(amount: number) {
    if (value.unit === 'all') return;
    const clamped = clampAmount(value.unit, amount);
    if (clamped !== value.amount) onChange({ unit: value.unit, amount: clamped });
    setDraft(String(clamped));
  }

  function handleStep(delta: number) {
    if (value.unit === 'all') return;
    commit(value.amount + delta);
  }

  function handleDraftBlur() {
    if (value.unit === 'all') return;
    const parsed = Number.parseInt(draft, 10);
    if (Number.isFinite(parsed)) commit(parsed);
    else setDraft(String(value.amount));
  }

  const showStepper = value.unit !== 'all';
  const bounds = value.unit === 'all' ? null : RANGE_UNIT_BOUNDS[value.unit];
  const atMin = bounds ? value.amount <= bounds.min : true;
  const atMax = bounds ? value.amount >= bounds.max : true;

  return (
    <div className="flex flex-col gap-2">
      <div
        role="tablist"
        aria-label="Range unit"
        className="pill-segment inline-flex w-full justify-between gap-1 rounded-full p-1"
      >
        {RANGE_UNITS.map((u) => (
          <button
            key={u}
            type="button"
            role="tab"
            aria-selected={value.unit === u}
            onClick={() => selectUnit(u)}
            className={`min-h-10 flex-1 rounded-full px-2 text-[13px] font-semibold tracking-tight transition-colors ${
              value.unit === u ? 'pill-segment-active' : 'text-muted hover:text-strong'
            }`}
          >
            {UNIT_LABELS[u]}
          </button>
        ))}
      </div>

      {showStepper && (
        <div className="glass-quiet flex items-center justify-between gap-3 rounded-full px-2 py-1">
          <span className="text-faint pl-3 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Previous
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleStep(-1)}
              disabled={atMin}
              aria-label="Decrease amount"
              className="text-strong min-h-9 min-w-9 rounded-full text-[18px] leading-none transition-colors active:opacity-70 disabled:opacity-30"
            >
              −
            </button>
            <input
              type="text"
              inputMode="numeric"
              value={draft}
              onChange={(e) => {
                const next = e.target.value.replace(/[^0-9]/g, '');
                setDraft(next);
              }}
              onBlur={handleDraftBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              }}
              aria-label={`Amount in ${value.unit}`}
              className="num-mono text-strong min-h-9 w-12 rounded-md bg-transparent text-center text-[15px] font-semibold tracking-tight focus:outline-none"
            />
            <button
              type="button"
              onClick={() => handleStep(1)}
              disabled={atMax}
              aria-label="Increase amount"
              className="text-strong min-h-9 min-w-9 rounded-full text-[18px] leading-none transition-colors active:opacity-70 disabled:opacity-30"
            >
              +
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
