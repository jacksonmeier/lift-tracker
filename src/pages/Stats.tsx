import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
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
import {
  biometricSummary,
  entriesInRange,
  metricSeries,
} from '../lib/biometricStats';
import type { BiometricEntry, LiftCategory, WorkoutType } from '../types';
import { LIFT_CATEGORIES } from '../types';
import { workoutTypeLabel } from '../lib/workoutType';
import { priorBounds, rangeShortLabel, rangeSince, type Range } from '../lib/range';
import CalendarHeatmap from '../components/CalendarHeatmap';
import HeroNumber from '../components/HeroNumber';
import RangePicker from '../components/RangePicker';

type Tab = 'lift' | 'body';

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

function weightDelta(current: number | null, prior: number | null): Delta | null {
  if (current === null || prior === null || current === prior) return null;
  const diff = current - prior;
  const sign = diff > 0 ? '+' : '−';
  return {
    direction: diff > 0 ? 'up' : 'down',
    display: `${sign}${Math.abs(diff).toFixed(1)} lb`,
  };
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

function formatChartDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatDuration(min: number): string {
  if (min <= 0) return '—';
  if (min < 60) return `${Math.round(min)}m`;
  const h = Math.floor(min / 60);
  const m = Math.round(min - h * 60);
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
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
const ACCENT_DEEP = 'var(--color-accent-700)';

function KpiTile({
  label,
  value,
  numeric,
  format,
  sub,
  delta,
  highlight,
}: {
  label: string;
  value: string;
  numeric?: number;
  format?: (n: number) => string;
  sub?: string;
  delta?: Delta | null;
  highlight?: boolean;
}) {
  const deltaClasses =
    delta?.direction === 'up'
      ? 'border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
      : 'border-rose-500/25 bg-rose-500/15 text-rose-700 dark:text-rose-300';
  return (
    <div
      className={`${highlight ? 'glass-strong' : 'glass'} relative overflow-hidden rounded-2xl px-3.5 py-3`}
    >
      <div className="section-label">{label}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        {typeof numeric === 'number' ? (
          <HeroNumber
            value={numeric}
            format={format}
            style={{ fontSize: 26, color: 'var(--text-strong)' }}
          />
        ) : (
          <span className="hero-num text-strong" style={{ fontSize: 26 }}>
            {value}
          </span>
        )}
        {delta && (
          <span
            className={`num-mono inline-flex shrink-0 items-center rounded-full border px-1.5 py-[1px] text-[10px] font-semibold ${deltaClasses}`}
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

interface ChartStyles {
  gridStroke: string;
  axisTick: { fontSize: number; fill: string };
  tooltipStyle: React.CSSProperties;
}

function MetricLineChart({
  data,
  unit,
  decimals = 0,
  styles,
}: {
  data: { date: string; value: number }[];
  unit: string;
  decimals?: number;
  styles: ChartStyles;
}) {
  if (data.length === 0) {
    return <p className="text-muted px-1 py-2 text-[13px]">No data in this range.</p>;
  }
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
          <XAxis
            dataKey="date"
            tick={styles.axisTick}
            tickLine={false}
            axisLine={{ stroke: styles.gridStroke }}
            tickFormatter={formatChartDate}
            minTickGap={20}
          />
          <YAxis
            tick={styles.axisTick}
            tickLine={false}
            axisLine={{ stroke: styles.gridStroke }}
            width={36}
            domain={['auto', 'auto']}
            tickFormatter={(v: number) => v.toFixed(decimals)}
          />
          <Tooltip
            contentStyle={styles.tooltipStyle}
            cursor={{ stroke: 'rgb(var(--accent-rgb) / 0.4)' }}
            labelFormatter={(label: string) => formatChartDate(label)}
            formatter={(value: number) => [`${value.toFixed(decimals)} ${unit}`, '']}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={ACCENT_DEEP}
            strokeWidth={2}
            dot={{ r: 3, fill: ACCENT, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: ACCENT_DEEP, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricBarChart({
  data,
  unit,
  gradientId,
  styles,
}: {
  data: { date: string; value: number }[];
  unit: string;
  gradientId: string;
  styles: ChartStyles;
}) {
  if (data.length === 0) {
    return <p className="text-muted px-1 py-2 text-[13px]">No data in this range.</p>;
  }
  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.95} />
              <stop offset="100%" stopColor={ACCENT_SOFT} stopOpacity={0.55} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={styles.gridStroke} />
          <XAxis
            dataKey="date"
            tick={styles.axisTick}
            tickLine={false}
            axisLine={{ stroke: styles.gridStroke }}
            tickFormatter={formatChartDate}
            minTickGap={20}
          />
          <YAxis
            tick={styles.axisTick}
            tickLine={false}
            axisLine={{ stroke: styles.gridStroke }}
            width={36}
          />
          <Tooltip
            contentStyle={styles.tooltipStyle}
            cursor={{ fill: 'rgb(var(--accent-rgb) / 0.08)' }}
            labelFormatter={(label: string) => formatChartDate(label)}
            formatter={(value: number) => [`${Math.round(value)} ${unit}`, '']}
          />
          <Bar
            dataKey="value"
            fill={`url(#${gradientId})`}
            radius={[6, 6, 2, 2]}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function BiometricRow({ entry }: { entry: BiometricEntry }) {
  return (
    <li className="flex flex-col gap-0.5 py-2">
      <span className="text-strong text-[13px] font-medium tracking-tight">
        {formatRelativeDate(entry.date)}
      </span>
      <span className="text-muted flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[12px]">
        {entry.weight !== undefined && entry.weight > 0 && (
          <span>
            <span className="text-strong num font-semibold">
              {entry.weight.toFixed(1)}
            </span>
            <span className="text-faint ml-0.5 text-[11px]">lb</span>
          </span>
        )}
        {entry.heartRate !== undefined && entry.heartRate > 0 && (
          <span>
            <span className="text-strong num font-semibold">
              {Math.round(entry.heartRate)}
            </span>
            <span className="text-faint ml-0.5 text-[11px]">bpm</span>
          </span>
        )}
        {entry.caloriesBurned !== undefined && entry.caloriesBurned > 0 && (
          <span>
            <span className="text-strong num font-semibold">
              {Math.round(entry.caloriesBurned)}
            </span>
            <span className="text-faint ml-0.5 text-[11px]">kcal</span>
          </span>
        )}
        {entry.workoutLengthMin !== undefined && entry.workoutLengthMin > 0 && (
          <span>
            <span className="text-strong num font-semibold">
              {Math.round(entry.workoutLengthMin)}
            </span>
            <span className="text-faint ml-0.5 text-[11px]">min</span>
          </span>
        )}
      </span>
    </li>
  );
}

export default function Stats() {
  const { state } = useApp();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('lift');
  const [range, setRange] = useState<Range>({ unit: 'weeks', amount: 12 });
  const [valueMode, setValueMode] = useState<'total' | 'avg'>('total');

  const since = useMemo(() => rangeSince(range), [range]);
  const prior = useMemo(() => priorBounds(range), [range]);

  // Lift stats memos
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

  const workingSetsValue =
    valueMode === 'avg' && currentTotals.workouts > 0
      ? currentTotals.workingSets / currentTotals.workouts
      : currentTotals.workingSets;
  const tonnageValue =
    valueMode === 'avg' && currentTotals.workouts > 0
      ? currentTotals.tonnage / currentTotals.workouts
      : currentTotals.tonnage;

  const deltas = useMemo(() => {
    if (!priorTotals) {
      return {
        workouts: null,
        workingSets: null,
        tonnage: null,
        prs: null,
      };
    }
    const wsPrior =
      valueMode === 'avg' && priorTotals.workouts > 0
        ? priorTotals.workingSets / priorTotals.workouts
        : priorTotals.workingSets;
    const tnPrior =
      valueMode === 'avg' && priorTotals.workouts > 0
        ? priorTotals.tonnage / priorTotals.workouts
        : priorTotals.tonnage;
    return {
      workouts: computeDelta(currentTotals.workouts, priorTotals.workouts),
      workingSets: computeDelta(workingSetsValue, wsPrior),
      tonnage: computeDelta(tonnageValue, tnPrior),
      prs: computeDelta(prs.length, priorPRCount),
    };
  }, [currentTotals, priorTotals, valueMode, workingSetsValue, tonnageValue, prs.length, priorPRCount]);

  // Body stats memos
  const hasAnyBiometric = state.biometrics.length > 0;

  const bioEntries = useMemo(
    () => entriesInRange(state, since),
    [state, since],
  );
  const bioSummary = useMemo(() => biometricSummary(bioEntries), [bioEntries]);
  const priorBioEntries = useMemo(
    () => (prior ? entriesInRange(state, prior.since, prior.until) : []),
    [state, prior],
  );
  const priorBioSummary = useMemo(
    () => (prior ? biometricSummary(priorBioEntries) : null),
    [priorBioEntries, prior],
  );
  const weightSeries = useMemo(() => metricSeries(bioEntries, 'weight'), [bioEntries]);
  const hrSeries = useMemo(() => metricSeries(bioEntries, 'heartRate'), [bioEntries]);
  const calSeries = useMemo(
    () => metricSeries(bioEntries, 'caloriesBurned'),
    [bioEntries],
  );
  const lengthSeries = useMemo(
    () => metricSeries(bioEntries, 'workoutLengthMin'),
    [bioEntries],
  );
  const recentEntries = useMemo(
    () => bioEntries.slice().reverse().slice(0, 8),
    [bioEntries],
  );

  const caloriesValue =
    valueMode === 'avg' && bioSummary.caloriesSamples > 0
      ? bioSummary.totalCalories / bioSummary.caloriesSamples
      : bioSummary.totalCalories;
  const lengthValue =
    valueMode === 'avg' && bioSummary.lengthSamples > 0
      ? bioSummary.totalLengthMin / bioSummary.lengthSamples
      : bioSummary.totalLengthMin;

  const bioDeltas = useMemo(() => {
    if (!priorBioSummary) {
      return { weight: null, heartRate: null, calories: null, length: null };
    }
    const calPrior =
      valueMode === 'avg' && priorBioSummary.caloriesSamples > 0
        ? priorBioSummary.totalCalories / priorBioSummary.caloriesSamples
        : priorBioSummary.totalCalories;
    const lenPrior =
      valueMode === 'avg' && priorBioSummary.lengthSamples > 0
        ? priorBioSummary.totalLengthMin / priorBioSummary.lengthSamples
        : priorBioSummary.totalLengthMin;
    return {
      weight: weightDelta(bioSummary.latestWeight, priorBioSummary.latestWeight),
      heartRate:
        bioSummary.avgHeartRate !== null && priorBioSummary.avgHeartRate !== null
          ? computeDelta(bioSummary.avgHeartRate, priorBioSummary.avgHeartRate)
          : null,
      calories:
        priorBioSummary.caloriesSamples > 0
          ? computeDelta(caloriesValue, calPrior)
          : null,
      length:
        priorBioSummary.lengthSamples > 0
          ? computeDelta(lengthValue, lenPrior)
          : null,
    };
  }, [bioSummary, priorBioSummary, valueMode, caloriesValue, lengthValue]);

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
  const chartStyles: ChartStyles = { gridStroke, axisTick, tooltipStyle };

  const showRange = hasAnyCompleted || hasAnyBiometric;

  return (
    <div className="route mx-auto max-w-md pb-12">
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
        <h1 className="text-strong text-[15px] font-semibold tracking-tight">Stats</h1>
        <span className="min-w-11" />
      </header>

      {!showRange ? (
        <div className="px-4 pt-6">
          <div className="glass rounded-2xl px-5 py-10 text-center">
            <p className="text-strong text-[15px] font-medium">Nothing to show yet.</p>
            <p className="text-muted mt-1 text-[13px]">
              Complete a workout or log a biometric entry to start seeing stats.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 pt-3">
          <div
            role="tablist"
            aria-label="Stats category"
            className="pill-segment inline-flex w-full justify-between gap-1 rounded-full p-1"
          >
            {(['lift', 'body'] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`min-h-10 flex-1 rounded-full px-2 text-[13px] font-semibold tracking-tight transition-colors ${
                  tab === t ? 'pill-segment-active' : 'text-muted hover:text-strong'
                }`}
              >
                {t === 'lift' ? 'Lift' : 'Body'}
              </button>
            ))}
          </div>

          <RangePicker value={range} onChange={setRange} />

          <div
            role="tablist"
            aria-label="Display mode"
            className="pill-segment inline-flex w-full justify-between gap-1 rounded-full p-1"
          >
            {(['total', 'avg'] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={valueMode === m}
                onClick={() => setValueMode(m)}
                className={`min-h-9 flex-1 rounded-full px-2 text-[12px] font-semibold tracking-tight transition-colors ${
                  valueMode === m ? 'pill-segment-active' : 'text-muted hover:text-strong'
                }`}
              >
                {m === 'total'
                  ? 'Totals'
                  : tab === 'body'
                    ? 'Per session'
                    : 'Per workout'}
              </button>
            ))}
          </div>

          {prior && (
            <div className="text-faint -mt-1 px-1 text-[11px]">
              Δ vs previous {rangeShortLabel(range).toLowerCase()}
            </div>
          )}

          {tab === 'lift' ? (
            !hasAnyCompleted ? (
              <div className="glass rounded-2xl px-5 py-10 text-center">
                <p className="text-strong text-[15px] font-medium">
                  No completed workouts yet.
                </p>
                <p className="text-muted mt-1 text-[13px]">
                  Finish a workout to see lift stats.
                </p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5">
                  <KpiTile
                    label="Workouts"
                    value={currentTotals.workouts.toLocaleString()}
                    numeric={currentTotals.workouts}
                    delta={deltas.workouts}
                  />
                  <KpiTile
                    label={valueMode === 'avg' ? 'Sets / workout' : 'Working sets'}
                    value={
                      valueMode === 'avg'
                        ? currentTotals.workouts > 0
                          ? workingSetsValue.toFixed(1)
                          : '—'
                        : currentTotals.workingSets.toLocaleString()
                    }
                    numeric={workingSetsValue}
                    format={
                      valueMode === 'avg' ? (n: number) => n.toFixed(1) : undefined
                    }
                    delta={deltas.workingSets}
                  />
                  <KpiTile
                    label={valueMode === 'avg' ? 'Tonnage / workout' : 'Tonnage'}
                    value={
                      valueMode === 'avg' && currentTotals.workouts === 0
                        ? '—'
                        : formatTonnage(tonnageValue)
                    }
                    numeric={tonnageValue}
                    format={formatTonnage}
                    delta={deltas.tonnage}
                    highlight
                  />
                  <KpiTile
                    label="Weekly streak"
                    value={streak.toLocaleString()}
                    numeric={streak}
                    sub={streak === 1 ? 'week' : 'weeks'}
                  />
                  <div className="col-span-2">
                    <KpiTile
                      label="PRs hit"
                      value={prs.length.toLocaleString()}
                      numeric={prs.length}
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
                  <CalendarHeatmap
                    counts={heatmapCounts}
                    weeks={12}
                    onCellTap={handleHeatmapTap}
                  />
                  <div className="text-faint mt-3 flex items-center justify-end gap-1.5 text-[10px]">
                    <span>Less</span>
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[rgba(120,120,135,0.10)] dark:bg-[rgba(255,255,255,0.05)]" />
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[rgb(var(--accent-rgb)/0.25)]" />
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[rgb(var(--accent-rgb)/0.55)]" />
                    <span className="h-2.5 w-2.5 rounded-[3px] bg-[rgb(var(--accent-rgb)/0.92)]" />
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
                            cursor={{ fill: 'rgb(var(--accent-rgb) / 0.08)' }}
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
                    <p className="text-muted px-1 py-2 text-[13px]">
                      No workouts in this range.
                    </p>
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
                              style={{
                                width: `${pct}%`,
                                backgroundColor: TYPE_BAR_COLORS[bucket],
                              }}
                            />
                          );
                        })}
                      </div>
                      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {(['push', 'pull', 'legs', 'untyped'] as const).map((bucket) => {
                          const count = typeCounts[bucket];
                          const label =
                            bucket === 'untyped' ? 'Untyped' : workoutTypeLabel(bucket);
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
                            cursor={{ fill: 'rgb(var(--accent-rgb) / 0.08)' }}
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
                    <p className="text-muted px-1 py-2 text-[13px]">
                      No working sets in this range.
                    </p>
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
                            <td className="text-default py-2 pr-2 text-right tabular-nums">
                              {m.sets}
                            </td>
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
                                  <span>
                                    +
                                    {(pr.weight - pr.previousBestAtReps).toFixed(
                                      pr.weight % 1 || pr.previousBestAtReps % 1 ? 1 : 0,
                                    )}{' '}
                                    from {pr.previousBestAtReps}
                                  </span>
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
                            {pr.weight}{' '}
                            <span className="text-muted text-[14px] font-normal">×</span>{' '}
                            {pr.reps}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </SectionCard>
              </>
            )
          ) : !hasAnyBiometric ? (
            <div className="glass rounded-2xl px-5 py-10 text-center">
              <p className="text-strong text-[15px] font-medium">
                No biometric entries yet.
              </p>
              <p className="text-muted mt-1 text-[13px]">
                <Link
                  to="/biometrics"
                  className="text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)] underline-offset-2 hover:underline"
                >
                  Log an entry
                </Link>{' '}
                to see body trends.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <KpiTile
                  label="Weight"
                  value={
                    bioSummary.latestWeight !== null
                      ? `${bioSummary.latestWeight.toFixed(1)} lb`
                      : '—'
                  }
                  numeric={bioSummary.latestWeight ?? undefined}
                  format={(n) => `${n.toFixed(1)} lb`}
                  delta={bioDeltas.weight}
                  sub={
                    bioSummary.weightSamples > 0
                      ? `${bioSummary.weightSamples} ${bioSummary.weightSamples === 1 ? 'log' : 'logs'}`
                      : 'No logs'
                  }
                  highlight
                />
                <KpiTile
                  label="Avg heart rate"
                  value={
                    bioSummary.avgHeartRate !== null
                      ? `${Math.round(bioSummary.avgHeartRate)} bpm`
                      : '—'
                  }
                  numeric={bioSummary.avgHeartRate ?? undefined}
                  format={(n) => `${Math.round(n)} bpm`}
                  delta={bioDeltas.heartRate}
                  sub={
                    bioSummary.heartRateSamples > 0
                      ? `${bioSummary.heartRateSamples} ${bioSummary.heartRateSamples === 1 ? 'log' : 'logs'}`
                      : 'No logs'
                  }
                />
                <KpiTile
                  label={valueMode === 'avg' ? 'Calories / session' : 'Calories'}
                  value={
                    valueMode === 'avg' && bioSummary.caloriesSamples === 0
                      ? '—'
                      : formatTonnage(caloriesValue)
                  }
                  numeric={caloriesValue}
                  format={formatTonnage}
                  delta={bioDeltas.calories}
                  sub={valueMode === 'avg' ? 'kcal avg' : 'kcal total'}
                />
                <KpiTile
                  label={valueMode === 'avg' ? 'Time / session' : 'Workout time'}
                  value={
                    valueMode === 'avg' && bioSummary.lengthSamples === 0
                      ? '—'
                      : formatDuration(lengthValue)
                  }
                  numeric={lengthValue}
                  format={formatDuration}
                  delta={bioDeltas.length}
                  sub={
                    bioSummary.lengthSamples > 0
                      ? `${bioSummary.lengthSamples} ${bioSummary.lengthSamples === 1 ? 'session' : 'sessions'}`
                      : undefined
                  }
                />
              </div>

              <SectionCard title="Weight">
                <MetricLineChart
                  data={weightSeries}
                  unit="lb"
                  decimals={1}
                  styles={chartStyles}
                />
              </SectionCard>

              <SectionCard title="Heart rate">
                <MetricLineChart data={hrSeries} unit="bpm" styles={chartStyles} />
              </SectionCard>

              <SectionCard title="Calories per session">
                <MetricBarChart
                  data={calSeries}
                  unit="kcal"
                  gradientId="body-cal-fill"
                  styles={chartStyles}
                />
              </SectionCard>

              <SectionCard title="Length per session">
                <MetricBarChart
                  data={lengthSeries}
                  unit="min"
                  gradientId="body-length-fill"
                  styles={chartStyles}
                />
              </SectionCard>

              <SectionCard title="Recent entries">
                {recentEntries.length === 0 ? (
                  <p className="text-muted px-1 py-2 text-[13px]">
                    No entries in this range.
                  </p>
                ) : (
                  <ul className="divide-y divide-[var(--hairline-soft)]">
                    {recentEntries.map((entry) => (
                      <BiometricRow key={entry.id} entry={entry} />
                    ))}
                  </ul>
                )}
              </SectionCard>
            </>
          )}
        </div>
      )}
    </div>
  );
}
