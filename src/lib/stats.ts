import type { AppState, Workout } from '../types';

export interface WorkingSet {
  workoutId: string;
  workoutDate: string;
  setId: string;
  setTimestamp: string;
  weight: number;
  reps: number;
}

export function epleyE1RM(weight: number, reps: number): number {
  return weight * (1 + reps / 30);
}

// A "working set" excludes warmups and zero/blank entries that don't represent real work.
// Optional `since` (ISO date) filters out sessions before that date.
export function workingSetsForLift(
  state: AppState,
  liftId: string,
  since?: string,
): WorkingSet[] {
  const out: WorkingSet[] = [];
  for (const w of state.workouts) {
    if (since && w.date < since) continue;
    for (const e of w.exercises) {
      if (e.liftId !== liftId) continue;
      for (const s of e.sets) {
        if (s.isWarmup) continue;
        if (s.weight <= 0 || s.reps <= 0) continue;
        out.push({
          workoutId: w.id,
          workoutDate: w.date,
          setId: s.id,
          setTimestamp: s.timestamp,
          weight: s.weight,
          reps: s.reps,
        });
      }
    }
  }
  return out;
}

export interface SessionPoint {
  date: string;
  value: number;
  setCount: number;
}

export function topWeightPerSession(
  state: AppState,
  liftId: string,
  since?: string,
): SessionPoint[] {
  return perSessionMax(state, liftId, (s) => s.weight, since);
}

export function topE1RMPerSession(
  state: AppState,
  liftId: string,
  since?: string,
): SessionPoint[] {
  return perSessionMax(state, liftId, (s) => epleyE1RM(s.weight, s.reps), since);
}

function perSessionMax(
  state: AppState,
  liftId: string,
  pick: (s: WorkingSet) => number,
  since?: string,
): SessionPoint[] {
  const byWorkout = new Map<string, { date: string; max: number; count: number }>();
  for (const set of workingSetsForLift(state, liftId, since)) {
    const v = pick(set);
    const existing = byWorkout.get(set.workoutId);
    if (!existing) {
      byWorkout.set(set.workoutId, { date: set.workoutDate, max: v, count: 1 });
    } else {
      if (v > existing.max) existing.max = v;
      existing.count += 1;
    }
  }
  return Array.from(byWorkout.values())
    .map(({ date, max, count }) => ({ date, value: max, setCount: count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ISO 8601 week (year + week number), e.g. "2026-W17".
export function isoWeekKey(iso: string): string {
  const d = new Date(iso);
  const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNum);
  const yearStart = Date.UTC(target.getUTCFullYear(), 0, 1);
  const weekNum = Math.ceil(((target.getTime() - yearStart) / 86_400_000 + 1) / 7);
  return `${target.getUTCFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

export interface WeeklyVolume {
  week: string;
  volume: number;
}

export function weeklyVolume(
  state: AppState,
  liftId: string,
  since?: string,
): WeeklyVolume[] {
  const totals = new Map<string, number>();
  for (const set of workingSetsForLift(state, liftId, since)) {
    const key = isoWeekKey(set.workoutDate);
    totals.set(key, (totals.get(key) ?? 0) + set.weight * set.reps);
  }
  return Array.from(totals.entries())
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export interface PRRow {
  date: string;
  weight: number;
  reps: number;
  e1RM: number;
}

export function prHistory(state: AppState, liftId: string, since?: string): PRRow[] {
  const sets = workingSetsForLift(state, liftId, since)
    .slice()
    .sort((a, b) => {
      if (a.workoutDate !== b.workoutDate) return a.workoutDate.localeCompare(b.workoutDate);
      return a.setTimestamp.localeCompare(b.setTimestamp);
    });
  const prs: PRRow[] = [];
  let best = -Infinity;
  for (const s of sets) {
    const e = epleyE1RM(s.weight, s.reps);
    if (e > best) {
      best = e;
      prs.push({ date: s.workoutDate, weight: s.weight, reps: s.reps, e1RM: e });
    }
  }
  return prs;
}

export function hasAnyData(state: AppState, liftId: string, since?: string): boolean {
  for (const w of state.workouts) {
    if (since && w.date < since) continue;
    for (const e of w.exercises) {
      if (e.liftId !== liftId) continue;
      for (const s of e.sets) {
        if (!s.isWarmup && s.weight > 0 && s.reps > 0) return true;
      }
    }
  }
  return false;
}

export function workoutsForLift(state: AppState, liftId: string): Workout[] {
  return state.workouts.filter((w) => w.exercises.some((e) => e.liftId === liftId));
}
