import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
  categoryVolume,
  dailySetCounts,
  globalWeeklyVolume,
  periodTotals,
  realPRs,
  topMovements,
  weeklyStreak,
  weeklyWorkoutCounts,
  workoutTypeCounts,
} from '../lib/stats';
import type { LiftCategory, WorkoutType } from '../types';
import { LIFT_CATEGORIES } from '../types';
import { workoutTypeLabel } from '../lib/workoutType';
import CalendarHeatmap from '../components/CalendarHeatmap';

type Range = '1w' | '4w' | '12w' | 'all';

const RANGE_LABELS: Record<Range, string> = {
  '1w': '1 week',
  '4w': '4 weeks',
  '12w': '12 weeks',
  all: 'All time',
};

const RANGE_WEEKS: Record<Exclude<Range, 'all'>, number> = {
  '1w': 1,
  '4w': 4,
  '12w': 12,
};

function rangeSince(range: Range): string | undefined {
  if (range === 'all') return undefined;
  const d = new Date();
  d.setDate(d.getDate() - RANGE_WEEKS[range] * 7);
  return d.toISOString();
}

function priorBounds(range: Range): { since: string; until: string } | null {
  if (range === 'all') return null;
  const weeks = RANGE_WEEKS[range];
  const now = new Date();
  const until = new Date(now);
  until.setDate(now.getDate() - weeks * 7);
  const since = new Date(until);
  since.setDate(until.getDate() - weeks * 7);
  return { since: since.toISOString(), until: until.toISOString() };
}

interface Delta {
  display: string;
  direction: 'up' | 'down';
}

function formatPct(pct: number): string {
  const abs = Math.abs(pct);
  if (abs >= 1000) return `${Math.round(abs)}%`;
  if (abs >= 100) return `${abs.toFixed(0)}%`;
  return `${abs.toFixed(1)}%`;
}

function computeDelta(current: number, prior: number): Delta | null {
  if (current === prior) return null;
  const diff = current - prior;
  const direction: Delta['direction'] = diff > 0 ? 'up' : 'down';
  if (prior === 0) {
    const sign = diff > 0 ? '+' : '−';
    return { display: `${sign}${Math.abs(diff).toLocaleString()}`, direction };
  }
  const pct = (diff / prior) * 100;
  const sign = pct > 0 ? '+' : '−';
  return { display: `${sign}${formatPct(pct)}`, direction };
}

function formatRelativeDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sameDate = new Date(d);
  sameDate.setHours(0, 0, 0, 0);
  const days = Math.round((today.getTime() - sameDate.getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatTonnage(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${(n / 1000).toFixed(0)}k`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return Math.round(n).toLocaleString();
}

const CATEGORY_LABELS: Record<LiftCategory, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
  other: 'Other',
};

const TYPE_BAR_COLORS: Record<WorkoutType | 'untyped', string> = {
  push: 'rgb(14 165 233)',
  pull: 'rgb(139 92 246)',
  legs: 'rgb(244 63 94)',
  untyped: 'rgba(120, 120, 135, 0.45)',
};

const ACCENT = 'var(--color-accent-500)';
const ACCENT_SOFT = 'var(--color-accent-300)';

function KpiTile({
  label,
  value,
  sub,
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: Delta | null;
}) {
  const deltaClasses =
    delta?.direction === 'up'
      ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : 'border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300';
  return (
    <div className="glass overflow-hidden rounded-2xl px-3.5 py-3">
      <div className="text-faint text-[10px] font-semibold uppercase tracking-[0.12em]">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="text-strong text-[22px] font-semibold tabular-nums tracking-tight">
          {value}
        </span>
        {delta && (
          <span
            className={`inline-flex shrink-0 items-center rounded-full border px-1.5 py-[1px] text-[10px] font-semibold tabular-nums ${deltaClasses}`}
          >
            {delta.display}
          </span>
        )}
      </div>
      {sub && <div className="text-muted mt-0.5 truncate text-[11px]">{sub}</div>}
    </div>
  );
}

function SectionCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="glass overflow-hidden rounded-2xl px-4 py-3.5">
      <h3 className="text-faint mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function Stats() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [range, setRange] = useState<Range>('12w');

  const since = useMemo(() => rangeSince(range), [range]);
  const prior = useMemo(() => priorBounds(range), [range]);

  const currentTotals = useMemo(() => periodTotals(state, since), [state, since]);
  const priorTotals = useMemo(
    () => (prior ? periodTotals(state, prior.since, prior.until) : null),
    [state, prior],
  );
  const streak = useMemo(() => weeklyStreak(state), [state]);

  const heatmapCounts = useMemo(() => dailySetCounts(state, 7 * 12), [state]);

  const frequencySeries = useMemo(() => {
    const counts = weeklyWorkoutCounts(state, since);
    const volumes = globalWeeklyVolume(state, since);
    const volByWeek = new Map(volumes.map((v) => [v.week, v.volume]));
    const weeks = new Set<string>([...counts.map((c) => c.week), ...volumes.map((v) => v.week)]);
    return Array.from(weeks)
      .sort()
      .map((week) => ({
        week,
        count: counts.find((c) => c.week === week)?.count ?? 0,
        volume: volByWeek.get(week) ?? 0,
      }));
  }, [state, since]);

  const typeCounts = useMemo(() => workoutTypeCounts(state, since), [state, since]);
  const typeTotal = typeCounts.push + typeCounts.pull + typeCounts.legs + typeCounts.untyped;

  const categoryData = useMemo(() => {
    const totals = categoryVolume(state, since);
    return LIFT_CATEGORIES.map((cat) => ({
      category: CATEGORY_LABELS[cat],
      volume: totals[cat],
    })).filter((row) => row.volume > 0);
  }, [state, since]);

  const movements = useMemo(() => topMovements(state, since), [state, since]);
  const allTimePRs = useMemo(() => realPRs(state), [state]);
  const prs = useMemo(
    () => (since ? allTimePRs.filter((pr) => pr.date >= since) : allTimePRs),
    [allTimePRs, since],
  );
  const priorPRCount = useMemo(() => {
    if (!prior) return 0;
    return allTimePRs.filter(
      (pr) => pr.date >= prior.since && pr.date < prior.until,
    ).length;
  }, [allTimePRs, prior]);

  const deltas = useMemo(() => {
    if (!priorTotals) {
      return {
        workouts: null,
        workingSets: null,
        tonnage: null,
        prs: null,
      };
    }
    return {
      workouts: computeDelta(currentTotals.workouts, priorTotals.workouts),
      workingSets: computeDelta(currentTotals.workingSets, priorTotals.workingSets),
      tonnage: computeDelta(currentTotals.tonnage, priorTotals.tonnage),
      prs: computeDelta(prs.length, priorPRCount),
    };
  }, [currentTotals, priorTotals, prs.length, priorPRCount]);

  const hasAnyCompleted = state.workouts.some((w) => w.status === 'complete');

  function handleHeatmapTap(dateKey: string) {
    const match = state.workouts
      .filter((w) => w.status === 'complete')
      .filter((w) => new Date(w.date).toLocaleDateString('en-CA') === dateKey)
      .sort((a, b) => b.date.localeCompare(a.date))[0];
    if (match) navigate(`/workout/${match.id}`);
  }

  const gridStroke = 'rgba(127,127,135,0.18)';
  const axisTick = { fontSize: 11, fill: 'var(--text-faint)' } as const;
  const tooltipStyle = {
    background: 'var(--glass-surface-strong)',
    border: '1px solid var(--hairline)',
    borderRadius: 12,
    backdropFilter: 'saturate(180%) blur(20px)',
    WebkitBackdropFilter: 'saturate(180%) blur(20px)',
    fontSize: 12,
    color: 'var(--text-default)',
  } as const;

  return (
    <div className="mx-auto max-w-md pb-12">
      <header className="glass-bar sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2.5">
        <Link
          to="/"
          className="btn-ghost-accent -ml-1 flex min-h-11 items-center px-2 text-[15px]"
        >
          ← Home
        </Link>
        <h1 className="text-strong text-[17px] font-semibold tracking-tight">Stats</h1>
        <span className="min-w-11" />
      </header>

      {!hasAnyCompleted ? (
        <div className="px-4 pt-6">
          <div className="glass rounded-2xl px-5 py-10 text-center">
            <p className="text-strong text-[15px] font-medium">No completed workouts yet.</p>
            <p className="text-muted mt-1 text-[13px]">
              Finish a workout to start seeing your training overview.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 pt-3">
          <div className="pill-segment inline-flex w-full justify-between gap-1 rounded-full p-1">
            {(['1w', '4w', '12w', 'all'] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`min-h-10 flex-1 rounded-full px-2 text-[13px] font-semibold tracking-tight transition-colors ${
                  range === r ? 'pill-segment-active' : 'text-muted hover:text-strong'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>

          {prior && (
            <div className="text-faint -mt-1 px-1 text-[11px]">
              Δ vs previous {RANGE_LABELS[range].toLowerCase()}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2.5">
            <KpiTile
              label="Workouts"
              value={currentTotals.workouts.toLocaleString()}
              delta={deltas.workouts}
            />
            <KpiTile
              label="Working sets"
              value={currentTotals.workingSets.toLocaleString()}
              delta={deltas.workingSets}
            />
            <KpiTile
              label="Tonnage"
              value={formatTonnage(currentTotals.tonnage)}
              delta={deltas.tonnage}
            />
            <KpiTile
              label="Weekly streak"
              value={streak.toLocaleString()}
              sub={streak === 1 ? 'week' : 'weeks'}
            />
            <div className="col-span-2">
              <KpiTile
                label="PRs hit"
                value={prs.length.toLocaleString()}
                delta={deltas.prs}
                sub={
                  prs.length === 0
                    ? 'No new PRs in this range'
                    : prs[0]
                      ? `Latest: ${prs[0].liftName} · ${prs[0].weight} × ${prs[0].reps} · ${formatRelativeDate(prs[0].date)}`
                      : undefined
                }
              />
            </div>
          </div>

          <SectionCard title="Last 12 weeks">
            <CalendarHeatmap counts={heatmapCounts} weeks={12} onCellTap={handleHeatmapTap} />
            <div className="text-faint mt-3 flex items-center justify-end gap-1.5 text-[10px]">
              <span>Less</span>
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[rgba(120,120,135,0.10)] dark:bg-[rgba(255,255,255,0.05)]" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[rgba(255,149,0,0.25)]" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[rgba(255,149,0,0.55)]" />
              <span className="h-2.5 w-2.5 rounded-[3px] bg-[rgba(255,149,0,0.92)]" />
              <span>More</span>
            </div>
          </SectionCard>

          <SectionCard title="Workouts & tonnage by week">
            {frequencySeries.length === 0 ? (
              <p className="text-muted px-1 py-2 text-[13px]">No data in this range.</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={frequencySeries}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="stats-bar-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.85} />
                        <stop offset="100%" stopColor={ACCENT_SOFT} stopOpacity={0.45} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      dataKey="week"
                      tick={axisTick}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                      tickFormatter={(w: string) => w.replace(/^\d+-/, '')}
                      minTickGap={10}
                    />
                    <YAxis
                      yAxisId="count"
                      tick={axisTick}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                      width={28}
                      allowDecimals={false}
                    />
                    <YAxis
                      yAxisId="volume"
                      orientation="right"
                      tick={axisTick}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                      width={42}
                      tickFormatter={(v: number) => formatTonnage(v)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: 'rgba(255,149,0,0.08)' }}
                      formatter={(value: number, name: string) => {
                        if (name === 'Workouts') return [value, name];
                        return [value.toLocaleString(), name];
                      }}
                    />
                    <Bar
                      yAxisId="count"
                      dataKey="count"
                      name="Workouts"
                      fill="url(#stats-bar-fill)"
                      radius={[6, 6, 2, 2]}
                      isAnimationActive={false}
                    />
                    <Line
                      yAxisId="volume"
                      type="monotone"
                      dataKey="volume"
                      name="Tonnage"
                      stroke="var(--color-accent-700)"
                      strokeWidth={2}
                      dot={false}
                      isAnimationActive={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Workout type split">
            {typeTotal === 0 ? (
              <p className="text-muted px-1 py-2 text-[13px]">No workouts in this range.</p>
            ) : (
              <div>
                <div className="flex h-3 w-full overflow-hidden rounded-full">
                  {(['push', 'pull', 'legs', 'untyped'] as const).map((bucket) => {
                    const count = typeCounts[bucket];
                    if (count === 0) return null;
                    const pct = (count / typeTotal) * 100;
                    return (
                      <div
                        key={bucket}
                        style={{ width: `${pct}%`, backgroundColor: TYPE_BAR_COLORS[bucket] }}
                      />
                    );
                  })}
                </div>
                <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {(['push', 'pull', 'legs', 'untyped'] as const).map((bucket) => {
                    const count = typeCounts[bucket];
                    const label = bucket === 'untyped' ? 'Untyped' : workoutTypeLabel(bucket);
                    return (
                      <li
                        key={bucket}
                        className="flex items-center justify-between text-[13px] tabular-nums"
                      >
                        <span className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: TYPE_BAR_COLORS[bucket] }}
                          />
                          <span className="text-default">{label}</span>
                        </span>
                        <span className="text-muted">{count}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Volume by category">
            {categoryData.length === 0 ? (
              <p className="text-muted px-1 py-2 text-[13px]">No data in this range.</p>
            ) : (
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="stats-cat-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.95} />
                        <stop offset="100%" stopColor={ACCENT_SOFT} stopOpacity={0.55} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                    <XAxis
                      dataKey="category"
                      tick={axisTick}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                    />
                    <YAxis
                      tick={axisTick}
                      tickLine={false}
                      axisLine={{ stroke: gridStroke }}
                      width={42}
                      tickFormatter={(v: number) => formatTonnage(v)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: 'rgba(255,149,0,0.08)' }}
                      formatter={(v: number) => [v.toLocaleString(), 'Volume']}
                    />
                    <Bar
                      dataKey="volume"
                      fill="url(#stats-cat-fill)"
                      radius={[6, 6, 2, 2]}
                      isAnimationActive={false}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Top movements">
            {movements.length === 0 ? (
              <p className="text-muted px-1 py-2 text-[13px]">No working sets in this range.</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-faint text-left text-[10px] font-semibold uppercase tracking-[0.12em]">
                    <th className="py-1.5 pr-2">Lift</th>
                    <th className="py-1.5 pr-2 text-right">Sessions</th>
                    <th className="py-1.5 pr-2 text-right">Sets</th>
                    <th className="py-1.5 text-right">Best set</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline-soft)]">
                  {movements.map((m) => (
                    <tr key={m.liftId}>
                      <td className="text-strong py-2 pr-2 font-medium">
                        <div className="truncate">{m.liftName}</div>
                        <div className="text-faint text-[11px] font-normal">
                          Last {formatRelativeDate(m.lastDate)}
                        </div>
                      </td>
                      <td className="text-default py-2 pr-2 text-right tabular-nums">
                        {m.sessions}
                      </td>
                      <td className="text-default py-2 pr-2 text-right tabular-nums">{m.sets}</td>
                      <td className="py-2 text-right font-semibold tabular-nums text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)]">
                        {m.bestSet.weight} × {m.bestSet.reps}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SectionCard>

          <SectionCard title="Recent PRs">
            {prs.length === 0 ? (
              <p className="text-muted px-1 py-2 text-[13px]">No PRs in this range.</p>
            ) : (
              <ul className="divide-y divide-[var(--hairline-soft)]">
                {prs.slice(0, 12).map((pr, i) => (
                  <li
                    key={`${pr.liftId}-${pr.date}-${i}`}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-strong truncate text-[14px] font-medium tracking-tight">
                        {pr.liftName}
                      </div>
                      <div className="text-faint mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px]">
                        <span className="text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)] font-semibold">
                          {pr.reps}RM
                        </span>
                        <span>·</span>
                        <span>{formatRelativeDate(pr.date)}</span>
                        {pr.previousBestAtReps !== null && (
                          <>
                            <span>·</span>
                            <span>+{(pr.weight - pr.previousBestAtReps).toFixed(pr.weight % 1 || pr.previousBestAtReps % 1 ? 1 : 0)} from {pr.previousBestAtReps}</span>
                          </>
                        )}
                      </div>
                      {pr.isHeaviestEver && (
                        <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-[var(--color-accent-500)]/35 bg-[var(--color-accent-500)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)]">
                          ★ Heaviest ever
                        </div>
                      )}
                    </div>
                    <div className="text-strong shrink-0 text-right text-[18px] font-semibold tabular-nums tracking-tight">
                      {pr.weight} <span className="text-muted text-[14px] font-normal">×</span>{' '}
                      {pr.reps}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </div>
      )}
    </div>
  );
}
