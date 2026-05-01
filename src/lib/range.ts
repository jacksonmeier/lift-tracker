export type RangeUnit = 'days' | 'weeks' | 'months' | 'all';

export interface Range {
  unit: RangeUnit;
  // Ignored when unit === 'all'.
  amount: number;
}

export const RANGE_UNITS: readonly RangeUnit[] = ['days', 'weeks', 'months', 'all'] as const;

export const RANGE_UNIT_BOUNDS: Record<Exclude<RangeUnit, 'all'>, { min: number; max: number }> = {
  days: { min: 1, max: 365 },
  weeks: { min: 1, max: 104 },
  months: { min: 1, max: 36 },
};

export function defaultAmount(unit: RangeUnit): number {
  switch (unit) {
    case 'days':
      return 30;
    case 'weeks':
      return 12;
    case 'months':
      return 6;
    case 'all':
      return 0;
  }
}

export function clampAmount(unit: RangeUnit, amount: number): number {
  if (unit === 'all') return 0;
  const { min, max } = RANGE_UNIT_BOUNDS[unit];
  if (!Number.isFinite(amount)) return min;
  return Math.max(min, Math.min(max, Math.round(amount)));
}

function applyOffset(date: Date, unit: RangeUnit, amount: number): Date {
  const d = new Date(date);
  switch (unit) {
    case 'days':
      d.setDate(d.getDate() - amount);
      return d;
    case 'weeks':
      d.setDate(d.getDate() - amount * 7);
      return d;
    case 'months':
      d.setMonth(d.getMonth() - amount);
      return d;
    case 'all':
      return d;
  }
}

export function rangeSince(range: Range, asOf: Date = new Date()): string | undefined {
  if (range.unit === 'all') return undefined;
  return applyOffset(asOf, range.unit, range.amount).toISOString();
}

export function priorBounds(
  range: Range,
  asOf: Date = new Date(),
): { since: string; until: string } | null {
  if (range.unit === 'all') return null;
  const until = applyOffset(asOf, range.unit, range.amount);
  const since = applyOffset(asOf, range.unit, range.amount * 2);
  return { since: since.toISOString(), until: until.toISOString() };
}

export function rangeShortLabel(range: Range): string {
  if (range.unit === 'all') return 'All time';
  const noun =
    range.amount === 1
      ? range.unit === 'days'
        ? 'day'
        : range.unit === 'weeks'
          ? 'week'
          : 'month'
      : range.unit;
  return `${range.amount} ${noun}`;
}
