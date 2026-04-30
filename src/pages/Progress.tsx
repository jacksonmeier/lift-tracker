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

type Range = '4w' | '12w' | 'all';

const RANGE_LABELS: Record<Range, string> = {
  '4w': '4 weeks',
  '12w': '12 weeks',
  all: 'All time',
};

function rangeSince(range: Range): string | undefined {
  if (range === 'all') return undefined;
  const weeks = range === '4w' ? 4 : 12;
  const d = new Date();
  d.setDate(d.getDate() - weeks * 7);
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
    <section className="rounded-lg border border-gray-200 bg-white p-3">
      <h3 className="mb-2 text-sm font-semibold text-gray-700">{title}</h3>
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
      <div className="rounded border border-gray-200 bg-white px-2 py-1 text-xs shadow-sm">
        <div className="font-medium">{formatLongDate(data.date)}</div>
        <div className="tabular-nums">
          {valueLabel}: {formatValue(data.value)}
        </div>
        <div className="tabular-nums text-gray-500">
          {data.setCount} {data.setCount === 1 ? 'set' : 'sets'}
        </div>
      </div>
    );
  };
}

const WeightTooltip = makeSessionTooltip('Top weight', (v) => String(v));
const E1RMTooltip = makeSessionTooltip('e1RM', (v) => v.toFixed(1));

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

  return (
    <div className="mx-auto max-w-md pb-12">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Link to="/" className="min-h-11 px-2 -ml-2 text-base text-blue-600 flex items-center">
          ← Home
        </Link>
        <h1 className="text-lg font-semibold">Progress</h1>
        <span className="min-w-11" />
      </header>

      <div className="px-4 py-3">
        {sortedLifts.length === 0 ? (
          <p className="text-sm text-gray-500">
            No lifts yet.{' '}
            <Link to="/lifts" className="text-blue-600 underline">
              Add one
            </Link>{' '}
            to get started.
          </p>
        ) : (
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Lift</span>
            <select
              value={liftId}
              onChange={(e) => setLiftId(e.target.value)}
              className="min-h-11 rounded-md border border-gray-300 bg-white px-3 text-base focus:border-blue-500 focus:outline-none"
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
        <div className="px-4 pb-3">
          <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {(['4w', '12w', 'all'] as Range[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`min-h-11 rounded-md px-3 text-sm font-medium ${
                  range === r ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
                }`}
              >
                {RANGE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
      )}

      {liftId && !hasData && (
        <p className="px-4 py-6 text-center text-sm text-gray-500">
          No data for this lift in the selected range.
        </p>
      )}

      {liftId && hasData && (
        <div className="flex flex-col gap-3 px-4">
          <ChartCard title="Top working-set weight per session">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weightSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 11 }}
                    minTickGap={20}
                  />
                  <YAxis tick={{ fontSize: 11 }} width={36} />
                  <Tooltip content={<WeightTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 3 }}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatShortDate}
                    tick={{ fontSize: 11 }}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={36}
                    tickFormatter={(v: number) => v.toFixed(0)}
                  />
                  <Tooltip content={<E1RMTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#9333ea"
                    strokeWidth={2}
                    dot={{ r: 3 }}
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(w: string) => w.replace(/^\d+-/, '')}
                    minTickGap={10}
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={44}
                    tickFormatter={(v: number) =>
                      v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)
                    }
                  />
                  <Tooltip formatter={(v: number) => [v.toLocaleString(), 'Volume']} />
                  <Bar dataKey="volume" fill="#16a34a" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="PR history">
            {bestPr && (
              <div className="mb-2 flex items-center justify-between rounded-md bg-amber-50 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Best e1RM
                </span>
                <span className="text-base font-semibold tabular-nums text-amber-900">
                  {bestPr.e1RM.toFixed(1)}{' '}
                  <span className="text-xs font-normal text-amber-700">
                    ({bestPr.weight} × {bestPr.reps})
                  </span>
                </span>
              </div>
            )}
            {prs.length === 0 ? (
              <p className="px-1 py-2 text-sm text-gray-500">No PRs in this range.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                    <th className="py-1 pr-2 font-semibold">Date</th>
                    <th className="py-1 pr-2 font-semibold">Weight</th>
                    <th className="py-1 pr-2 font-semibold">Reps</th>
                    <th className="py-1 font-semibold">e1RM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {prs
                    .slice()
                    .reverse()
                    .map((pr, i) => (
                      <tr key={`${pr.date}-${i}`}>
                        <td className="py-1.5 pr-2">{formatLongDate(pr.date)}</td>
                        <td className="py-1.5 pr-2 tabular-nums">{pr.weight}</td>
                        <td className="py-1.5 pr-2 tabular-nums">{pr.reps}</td>
                        <td className="py-1.5 tabular-nums">{pr.e1RM.toFixed(1)}</td>
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
