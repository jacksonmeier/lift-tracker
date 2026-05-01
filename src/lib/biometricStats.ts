import type { AppState, BiometricEntry } from '../types';

export type BiometricMetric =
  | 'weight'
  | 'heartRate'
  | 'caloriesBurned'
  | 'workoutLengthMin';

export function entriesInRange(
  state: AppState,
  since?: string,
  until?: string,
): BiometricEntry[] {
  return state.biometrics
    .filter((e) => (since ? e.date >= since : true))
    .filter((e) => (until ? e.date < until : true))
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date));
}

export interface BiometricSummary {
  latestWeight: number | null;
  weightSamples: number;
  avgHeartRate: number | null;
  heartRateSamples: number;
  totalCalories: number;
  caloriesSamples: number;
  totalLengthMin: number;
  lengthSamples: number;
}

function hasMetric(entry: BiometricEntry, metric: BiometricMetric): boolean {
  return (entry[metric] ?? 0) > 0;
}

export function biometricSummary(entries: BiometricEntry[]): BiometricSummary {
  const weights = entries.filter((e) => hasMetric(e, 'weight'));
  const hrs = entries.filter((e) => hasMetric(e, 'heartRate'));
  const cals = entries.filter((e) => hasMetric(e, 'caloriesBurned'));
  const lengths = entries.filter((e) => hasMetric(e, 'workoutLengthMin'));

  const sum = (arr: BiometricEntry[], key: BiometricMetric) =>
    arr.reduce((s, e) => s + (e[key] ?? 0), 0);

  return {
    latestWeight:
      weights.length > 0 ? (weights[weights.length - 1]!.weight ?? null) : null,
    weightSamples: weights.length,
    avgHeartRate: hrs.length > 0 ? sum(hrs, 'heartRate') / hrs.length : null,
    heartRateSamples: hrs.length,
    totalCalories: sum(cals, 'caloriesBurned'),
    caloriesSamples: cals.length,
    totalLengthMin: sum(lengths, 'workoutLengthMin'),
    lengthSamples: lengths.length,
  };
}

export interface MetricPoint {
  date: string;
  value: number;
}

export function metricSeries(
  entries: BiometricEntry[],
  metric: BiometricMetric,
): MetricPoint[] {
  const out: MetricPoint[] = [];
  for (const e of entries) {
    if (!hasMetric(e, metric)) continue;
    out.push({ date: e.date, value: e[metric] as number });
  }
  return out;
}
