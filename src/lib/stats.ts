import type { AppState, LiftCategory, Workout, WorkoutType } from '../types';

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

// ---------------------------------------------------------------------------
// Global / cross-lift helpers (used by /stats).
// All helpers below count only workouts with status === 'complete'.
// ---------------------------------------------------------------------------

function isWorkingSetRow(set: { isWarmup: boolean; weight: number; reps: number }): boolean {
  return !set.isWarmup && set.weight > 0 && set.reps > 0;
}

function localDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA');
}

export interface GlobalWorkingSet extends WorkingSet {
  liftId: string;
}

export function allWorkingSets(state: AppState, since?: string): GlobalWorkingSet[] {
  const out: GlobalWorkingSet[] = [];
  for (const w of state.workouts) {
    if (w.status !== 'complete') continue;
    if (since && w.date < since) continue;
    for (const e of w.exercises) {
      for (const s of e.sets) {
        if (!isWorkingSetRow(s)) continue;
        out.push({
          workoutId: w.id,
          workoutDate: w.date,
          setId: s.id,
          setTimestamp: s.timestamp,
          weight: s.weight,
          reps: s.reps,
          liftId: e.liftId,
        });
      }
    }
  }
  return out;
}

export interface WeeklyCount {
  week: string;
  count: number;
}

export function weeklyWorkoutCounts(state: AppState, since?: string): WeeklyCount[] {
  const counts = new Map<string, number>();
  for (const w of state.workouts) {
    if (w.status !== 'complete') continue;
    if (since && w.date < since) continue;
    const key = isoWeekKey(w.date);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([week, count]) => ({ week, count }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

export function globalWeeklyVolume(state: AppState, since?: string): WeeklyVolume[] {
  const totals = new Map<string, number>();
  for (const set of allWorkingSets(state, since)) {
    const key = isoWeekKey(set.workoutDate);
    totals.set(key, (totals.get(key) ?? 0) + set.weight * set.reps);
  }
  return Array.from(totals.entries())
    .map(([week, volume]) => ({ week, volume }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

// Consecutive ISO weeks ending in the most recent active week, with a one-week
// grace if the current week has no workouts yet (so an early-week check-in
// doesn't read as "streak: 0" when last week was active).
export function weeklyStreak(state: AppState, asOf: Date = new Date()): number {
  const weeks = new Set<string>();
  for (const w of state.workouts) {
    if (w.status !== 'complete') continue;
    weeks.add(isoWeekKey(w.date));
  }
  if (weeks.size === 0) return 0;

  const cursor = new Date(asOf);
  let key = isoWeekKey(cursor.toISOString());
  if (!weeks.has(key)) {
    cursor.setDate(cursor.getDate() - 7);
    key = isoWeekKey(cursor.toISOString());
    if (!weeks.has(key)) return 0;
  }

  let streak = 0;
  while (weeks.has(key)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 7);
    key = isoWeekKey(cursor.toISOString());
  }
  return streak;
}

export type CategoryVolume = Record<LiftCategory, number>;

export function categoryVolume(state: AppState, since?: string): CategoryVolume {
  const liftCategory = new Map<string, LiftCategory>();
  for (const l of state.lifts) liftCategory.set(l.id, l.category);
  const totals: CategoryVolume = { push: 0, pull: 0, legs: 0, core: 0, other: 0 };
  for (const set of allWorkingSets(state, since)) {
    const cat = liftCategory.get(set.liftId);
    if (!cat) continue;
    totals[cat] += set.weight * set.reps;
  }
  return totals;
}

export type WorkoutTypeBucket = WorkoutType | 'untyped';
export type WorkoutTypeCounts = Record<WorkoutTypeBucket, number>;

export function workoutTypeCounts(state: AppState, since?: string): WorkoutTypeCounts {
  const counts: WorkoutTypeCounts = { push: 0, pull: 0, legs: 0, untyped: 0 };
  for (const w of state.workouts) {
    if (w.status !== 'complete') continue;
    if (since && w.date < since) continue;
    counts[w.type ?? 'untyped'] += 1;
  }
  return counts;
}

// Per local-date count of working sets across all lifts. Limits to last
// `sinceDays` days from `asOf` (default: today). Used by the calendar heatmap.
export function dailySetCounts(
  state: AppState,
  sinceDays: number,
  asOf: Date = new Date(),
): Map<string, number> {
  const cutoff = new Date(asOf);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - sinceDays);
  const cutoffIso = cutoff.toISOString();
  const out = new Map<string, number>();
  for (const set of allWorkingSets(state, cutoffIso)) {
    const key = localDateKey(set.workoutDate);
    out.set(key, (out.get(key) ?? 0) + 1);
  }
  return out;
}

export interface BestSet {
  weight: number;
  reps: number;
}

export interface TopMovement {
  liftId: string;
  liftName: string;
  sessions: number;
  sets: number;
  bestSet: BestSet;
  lastDate: string;
}

export function topMovements(
  state: AppState,
  since?: string,
  limit = 8,
): TopMovement[] {
  const liftName = new Map<string, string>();
  for (const l of state.lifts) liftName.set(l.id, l.name);

  const agg = new Map<
    string,
    { sets: number; sessions: Set<string>; bestSet: BestSet; lastDate: string }
  >();
  for (const set of allWorkingSets(state, since)) {
    let row = agg.get(set.liftId);
    if (!row) {
      row = {
        sets: 0,
        sessions: new Set(),
        bestSet: { weight: 0, reps: 0 },
        lastDate: set.workoutDate,
      };
      agg.set(set.liftId, row);
    }
    row.sets += 1;
    row.sessions.add(set.workoutId);
    if (
      set.weight > row.bestSet.weight ||
      (set.weight === row.bestSet.weight && set.reps > row.bestSet.reps)
    ) {
      row.bestSet = { weight: set.weight, reps: set.reps };
    }
    if (set.workoutDate > row.lastDate) row.lastDate = set.workoutDate;
  }

  return Array.from(agg.entries())
    .map(([liftId, r]) => ({
      liftId,
      liftName: liftName.get(liftId) ?? 'Unknown lift',
      sessions: r.sessions.size,
      sets: r.sets,
      bestSet: r.bestSet,
      lastDate: r.lastDate,
    }))
    .sort((a, b) => {
      if (b.sets !== a.sets) return b.sets - a.sets;
      if (b.sessions !== a.sessions) return b.sessions - a.sessions;
      return a.liftName.localeCompare(b.liftName);
    })
    .slice(0, limit);
}

export interface RealPR {
  liftId: string;
  liftName: string;
  date: string;
  weight: number;
  reps: number;
  // True if this set's weight beat every prior working set across all rep counts
  // (i.e. heaviest-ever load for this lift, regardless of reps).
  isHeaviestEver: boolean;
  // The previous best weight at this exact rep count, or null if this was the
  // first working set ever recorded at this rep count.
  previousBestAtReps: number | null;
}

// "Real" PRs across all lifts: a working set qualifies as a PR when it beats
// the previous best weight ever lifted at that rep count (treating each rep
// count as its own ladder — so a heavier 1RM, more reps at a known weight, and
// an unattempted-rep-count first-attempt all count). PR detection runs over
// the full lift history (so we know what the prior best was), but only sets
// whose workout date falls within `since` are emitted in the feed.
export function realPRs(state: AppState, since?: string): RealPR[] {
  const liftName = new Map<string, string>();
  for (const l of state.lifts) liftName.set(l.id, l.name);

  const byLift = new Map<string, GlobalWorkingSet[]>();
  for (const set of allWorkingSets(state)) {
    let arr = byLift.get(set.liftId);
    if (!arr) {
      arr = [];
      byLift.set(set.liftId, arr);
    }
    arr.push(set);
  }

  const out: RealPR[] = [];
  for (const [liftId, sets] of byLift) {
    sets.sort((a, b) => {
      if (a.workoutDate !== b.workoutDate) return a.workoutDate.localeCompare(b.workoutDate);
      return a.setTimestamp.localeCompare(b.setTimestamp);
    });

    const bestAtReps = new Map<number, number>();
    let bestWeight = 0;

    for (const set of sets) {
      const prevAtReps = bestAtReps.get(set.reps) ?? 0;
      if (set.weight > prevAtReps) {
        const inRange = !since || set.workoutDate >= since;
        if (inRange) {
          out.push({
            liftId,
            liftName: liftName.get(liftId) ?? 'Unknown lift',
            date: set.workoutDate,
            weight: set.weight,
            reps: set.reps,
            isHeaviestEver: set.weight > bestWeight,
            previousBestAtReps: prevAtReps > 0 ? prevAtReps : null,
          });
        }
        bestAtReps.set(set.reps, set.weight);
      }
      if (set.weight > bestWeight) bestWeight = set.weight;
    }
  }

  out.sort((a, b) => b.date.localeCompare(a.date));
  return out;
}

export interface PeriodTotals {
  workouts: number;
  workingSets: number;
  tonnage: number;
}

// Single-pass totals over completed workouts within an optional [since, until)
// window. `until` is exclusive, matching the convention of the existing `since`
// (>=) filter. Used for current-vs-prior period delta computation.
export function periodTotals(
  state: AppState,
  since?: string,
  until?: string,
): PeriodTotals {
  let workouts = 0;
  let workingSets = 0;
  let tonnage = 0;
  for (const w of state.workouts) {
    if (w.status !== 'complete') continue;
    if (since && w.date < since) continue;
    if (until && w.date >= until) continue;
    workouts += 1;
    for (const e of w.exercises) {
      for (const s of e.sets) {
        if (!isWorkingSetRow(s)) continue;
        workingSets += 1;
        tonnage += s.weight * s.reps;
      }
    }
  }
  return { workouts, workingSets, tonnage };
}
