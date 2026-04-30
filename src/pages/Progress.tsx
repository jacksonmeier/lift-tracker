import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from 'recharts';
import { useApp } from '../context/AppContext';
import {
  hasAnyData,
  prHistory,
  topE1RMPerSession,
  topWeightPerSession,
  weeklyVolume,
} from '../lib/stats';
import HeroNumber from '../components/HeroNumber';

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

function formatShortDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="glass overflow-hidden rounded-2xl px-4 py-3.5">
      <h3 className="text-faint mb-2.5 text-[11px] font-semibold uppercase tracking-[0.12em]">
        {title}
      </h3>
      {children}
    </section>
  );
}

interface SessionTooltipPayload {
  value: number;
  setCount: number;
  date: string;
}

function makeSessionTooltip(valueLabel: string, formatValue: (v: number) => string) {
  return function SessionTooltip({ active, payload }: TooltipProps<number, string>) {
    if (!active || !payload || payload.length === 0) return null;
    const data = payload[0]?.payload as SessionTooltipPayload | undefined;
    if (!data) return null;
    return (
      <div className="glass-strong rounded-xl px-3 py-2 text-[12px]">
        <div className="text-strong font-semibold tracking-tight">
          {formatLongDate(data.date)}
        </div>
        <div className="text-default tabular-nums">
          {valueLabel}: {formatValue(data.value)}
        </div>
        <div className="text-faint tabular-nums">
          {data.setCount} {data.setCount === 1 ? 'set' : 'sets'}
        </div>
      </div>
    );
  };
}

const WeightTooltip = makeSessionTooltip('Top weight', (v) => String(v));
const E1RMTooltip = makeSessionTooltip('e1RM', (v) => v.toFixed(1));

const ACCENT = 'var(--color-accent-500)';
const ACCENT_SOFT = 'var(--color-accent-300)';

export default function Progress() {
  const { state } = useApp();
  const [liftId, setLiftId] = useState<string>('');
  const [range, setRange] = useState<Range>('all');

  const since = useMemo(() => rangeSince(range), [range]);

  const sortedLifts = useMemo(
    () => state.lifts.slice().sort((a, b) => a.name.localeCompare(b.name)),
    [state.lifts],
  );

  const weightSeries = useMemo(
    () => (liftId ? topWeightPerSession(state, liftId, since) : []),
    [state, liftId, since],
  );
  const e1rmSeries = useMemo(
    () => (liftId ? topE1RMPerSession(state, liftId, since) : []),
    [state, liftId, since],
  );
  const volume = useMemo(
    () => (liftId ? weeklyVolume(state, liftId, since) : []),
    [state, liftId, since],
  );
  const prs = useMemo(
    () => (liftId ? prHistory(state, liftId, since) : []),
    [state, liftId, since],
  );
  const bestPr = prs.length > 0 ? prs[prs.length - 1] : null;

  const hasData = liftId ? hasAnyData(state, liftId, since) : false;

  const gridStroke = 'rgba(127,127,135,0.18)';
  const axisTick = { fontSize: 11, fill: 'var(--text-faint)' } as const;

  return (
    <div className="route mx-auto max-w-md pb-12">
      <header className="glass-bar sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2.5">
        <Link
          to="/"
          className="btn-ghost-accent -ml-1 flex min-h-11 items-center px-2 text-[14px] font-medium"
        >
          <span aria-hidden="true" className="mr-0.5 text-[18px] leading-none">
            ‹
          </span>
          Home
        </Link>
        <h1 className="text-strong text-[15px] font-semibold tracking-tight">Progress</h1>
        <span className="min-w-11" />
      </header>

      <div className="px-4 pt-4">
        {sortedLifts.length === 0 ? (
          <div className="glass rounded-2xl px-5 py-8 text-center">
            <p className="text-strong text-[15px] font-medium">No lifts yet.</p>
            <p className="text-muted mt-1 text-[13px]">
              <Link to="/lifts" className="btn-ghost-accent">
                Add a lift
              </Link>{' '}
              to start tracking progress.
            </p>
          </div>
        ) : (
          <label className="flex flex-col gap-1.5">
            <span className="text-faint px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
              Lift
            </span>
            <select
              value={liftId}
              onChange={(e) => setLiftId(e.target.value)}
              className="glass-input min-h-12 w-full rounded-xl px-3 text-[15px] font-medium tracking-tight"
            >
              <option value="">Select a lift…</option>
              {sortedLifts.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {liftId && (
        <div className="px-4 pt-3">
          <div className="pill-segment inline-flex w-full justify-between gap-1 rounded-full p-1">
            {(['1w', '4w', '12w', 'all'] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`min-h-10 flex-1 rounded-full px-2 text-[13px] font-semibold tracking-tight transition-colors ${
                  range === r
                    ? 'pill-segment-active'
                    : 'text-muted hover:text-strong'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}

      {liftId && !hasData && (
        <div className="px-4 pt-4">
          <div className="glass-quiet rounded-2xl px-4 py-8 text-center">
            <p className="text-muted text-[13px]">
              No data for this lift in the selected range.
            </p>
          </div>
        </div>
      )}

      {liftId && hasData && (
        <div className="flex flex-col gap-3 px-4 pt-4">
          {bestPr && (
            <section className="glass-strong relative overflow-hidden rounded-2xl px-4 py-4">
              <svg
                width="160"
                height="160"
                viewBox="0 0 160 160"
                aria-hidden="true"
                className="pointer-events-none absolute -right-8 -top-8 opacity-50"
              >
                <defs>
                  <linearGradient id="prog-arc" x1="0" x2="1" y1="0" y2="1">
                    <stop offset="0" stopColor="var(--color-accent-400)" stopOpacity="0.65" />
                    <stop offset="1" stopColor="var(--color-accent-600)" stopOpacity="0.1" />
                  </linearGradient>
                </defs>
                <circle
                  cx="80"
                  cy="80"
                  r="76"
                  fill="none"
                  stroke="var(--hairline-strong)"
                  strokeOpacity="0.3"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="none"
                  stroke="url(#prog-arc)"
                  strokeWidth="2"
                  strokeDasharray="2 4"
                />
              </svg>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="section-label">
                    <span className="dot" />
                    Best e1RM
                  </div>
                  <HeroNumber
                    value={bestPr.e1RM}
                    format={(v) => v.toFixed(1)}
                    style={{
                      fontSize: 36,
                      color: 'var(--text-strong)',
                      display: 'inline-block',
                      marginTop: 6,
                    }}
                  />
                </div>
                <div className="text-right">
                  <div className="section-label justify-end">Set</div>
                  <div className="text-strong num-display mt-1 text-[15px] tracking-tight">
                    {bestPr.weight} × {bestPr.reps}
                  </div>
                  <div className="text-faint num-mono mt-0.5 text-[11px] tracking-[0.05em]">
                    {formatLongDate(bestPr.date).toUpperCase()}
                  </div>
                </div>
              </div>
            </section>
          )}

          <ChartCard title="Top working-set weight per session">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                    width={36}
                  />
                  <Tooltip
                    content={<WeightTooltip />}
                    cursor={{ stroke: gridStroke, strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={ACCENT}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: ACCENT, stroke: ACCENT }}
                    activeDot={{ r: 5, fill: ACCENT, stroke: 'white', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Estimated 1RM per session (Epley)">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={e1rmSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                    width={36}
                    tickFormatter={(v: number) => v.toFixed(0)}
                  />
                  <Tooltip
                    content={<E1RMTooltip />}
                    cursor={{ stroke: gridStroke, strokeWidth: 1 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={ACCENT}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: ACCENT, stroke: ACCENT }}
                    activeDot={{ r: 5, fill: ACCENT, stroke: 'white', strokeWidth: 2 }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Weekly volume (weight × reps)">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volume} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="volume-fill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={ACCENT} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={ACCENT_SOFT} stopOpacity={0.55} />
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
                    tick={axisTick}
                    tickLine={false}
                    axisLine={{ stroke: gridStroke }}
                    width={44}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                    }
                  />
                  <Tooltip
                    formatter={(v: number) => [v.toLocaleString(), 'Volume']}
                    contentStyle={{
                      background: 'var(--glass-surface-strong)',
                      border: '1px solid var(--hairline)',
                      borderRadius: 12,
                      backdropFilter: 'saturate(180%) blur(20px)',
                      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                      fontSize: 12,
                      color: 'var(--text-default)',
                    }}
                    cursor={{ fill: 'rgba(255,149,0,0.08)' }}
                  />
                  <Bar
                    dataKey="volume"
                    fill="url(#volume-fill)"
                    radius={[6, 6, 2, 2]}
                    isAnimationActive={false}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="PR history">
            {prs.length === 0 ? (
              <p className="text-muted px-1 py-2 text-[13px]">No PRs in this range.</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-faint text-left text-[10px] font-semibold uppercase tracking-[0.12em]">
                    <th className="py-1.5 pr-2">Date</th>
                    <th className="py-1.5 pr-2">Weight</th>
                    <th className="py-1.5 pr-2">Reps</th>
                    <th className="py-1.5">e1RM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--hairline-soft)]">
                  {prs
                    .slice()
                    .reverse()
                    .map((pr, i) => (
                      <tr key={`${pr.date}-${i}`}>
                        <td className="text-default py-2 pr-2">{formatLongDate(pr.date)}</td>
                        <td className="text-strong py-2 pr-2 font-medium tabular-nums">
                          {pr.weight}
                        </td>
                        <td className="text-strong py-2 pr-2 font-medium tabular-nums">
                          {pr.reps}
                        </td>
                        <td className="py-2 font-semibold tabular-nums text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)]">
                          {pr.e1RM.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </ChartCard>
        </div>
      )}
    </div>
  );
}
