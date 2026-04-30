import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import type { Workout } from '../types';
import { workoutTypeLabel, workoutTypePillClasses } from '../lib/workoutType';
import BrandMark from '../components/BrandMark';
import HeroNumber from '../components/HeroNumber';
import TickMarks from '../components/TickMarks';

function formatRowDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function summarize(workout: Workout): { exCount: number; setCount: number } {
  const exCount = workout.exercises.length;
  const setCount = workout.exercises.reduce(
    (n, e) => n + e.sets.filter((s) => !s.isWarmup).length,
    0,
  );
  return { exCount, setCount };
}

function summaryText({ exCount, setCount }: { exCount: number; setCount: number }): string {
  const exLabel = `${exCount} ${exCount === 1 ? 'lift' : 'lifts'}`;
  const setLabel = `${setCount} ${setCount === 1 ? 'set' : 'sets'}`;
  return `${exLabel} · ${setLabel}`;
}

export default function Home() {
  const { state, actions } = useApp();
  const navigate = useNavigate();

  const sorted = useMemo(
    () =>
      state.workouts.slice().sort((a, b) => b.date.localeCompare(a.date)),
    [state.workouts],
  );

  const inProgress = sorted.find((w) => w.status === 'in-progress');
  const recent = sorted.filter((w) => w.status === 'complete');

  const last7 = useMemo(() => {
    const cutoff = Date.now() - 7 * 86_400_000;
    return state.workouts.filter(
      (w) => w.status === 'complete' && new Date(w.date).getTime() > cutoff,
    ).length;
  }, [state.workouts]);

  function handleStart() {
    if (inProgress) {
      navigate(`/workout/${inProgress.id}`);
      return;
    }
    const workout = actions.startWorkout();
    navigate(`/workout/${workout.id}`);
  }

  function handleDelete(workout: Workout) {
    const label = formatRowDate(workout.date);
    if (!window.confirm(`Delete workout from ${label}? This can't be undone.`)) return;
    actions.deleteWorkout(workout.id);
  }

  const today = new Date();
  const todayStamp = today
    .toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })
    .toUpperCase();

  return (
    <div className="route mx-auto max-w-md pb-16">
      <header className="glass-bar sticky top-0 z-20 flex items-center justify-between gap-2 px-4 py-3">
        <h1 className="text-strong flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <BrandMark />
          <span>Lift</span>
          <span className="text-muted font-medium">Tracker</span>
        </h1>
        <nav className="flex items-center gap-0.5 text-[13px]">
          <Link
            to="/lifts"
            className="btn-ghost-accent flex min-h-9 items-center px-2 font-medium"
          >
            Lifts
          </Link>
          <Link
            to="/stats"
            className="btn-ghost-accent flex min-h-9 items-center px-2 font-medium"
          >
            Stats
          </Link>
          <Link
            to="/progress"
            className="btn-ghost-accent flex min-h-9 items-center px-2 font-medium"
          >
            Progress
          </Link>
          <Link
            to="/settings"
            className="btn-ghost-accent flex min-h-9 items-center px-2 font-medium"
            aria-label="Settings"
          >
            •••
          </Link>
        </nav>
      </header>

      <div className="px-4 pt-6">
        <div className="glass-strong anim-slide relative overflow-hidden rounded-2xl px-4 py-4">
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 opacity-60"
          >
            <defs>
              <linearGradient id="home-arc" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="var(--color-accent-400)" stopOpacity="0.7" />
                <stop offset="1" stopColor="var(--color-accent-600)" stopOpacity="0.1" />
              </linearGradient>
            </defs>
            <circle
              cx="90"
              cy="90"
              r="86"
              fill="none"
              stroke="var(--hairline-strong)"
              strokeOpacity="0.3"
            />
            <circle
              cx="90"
              cy="90"
              r="68"
              fill="none"
              stroke="url(#home-arc)"
              strokeWidth="2"
              strokeDasharray="2 4"
            />
            <circle
              cx="90"
              cy="90"
              r="50"
              fill="none"
              stroke="var(--hairline-strong)"
              strokeOpacity="0.15"
            />
          </svg>

          <div className="flex items-center justify-between">
            <span className="section-label">
              <span className="dot" />
              Today
            </span>
            <span className="num-mono text-faint text-[11px] tracking-[0.05em]">
              {todayStamp}
            </span>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <HeroNumber
              value={last7}
              style={{ fontSize: 64, color: 'var(--text-strong)' }}
            />
            <span className="text-muted text-[13px] leading-tight">
              {last7 === 1 ? 'workout' : 'workouts'}
              <br />
              <span className="text-faint text-[11px]">last 7 days</span>
            </span>
          </div>

          <div className="mt-2">
            <TickMarks active={Math.min(14, last7 * 2)} total={14} />
          </div>

          <button
            type="button"
            onClick={handleStart}
            className="btn-accent mt-5 flex min-h-[52px] w-full items-center justify-center gap-1.5 rounded-2xl text-[16px] font-semibold tracking-tight"
          >
            {inProgress ? 'Resume Workout' : 'Start New Workout'}
            <span aria-hidden="true" className="text-[12px] opacity-85">
              ↗
            </span>
          </button>
        </div>

        {inProgress && (
          <div className="glass anim-slide mt-3 flex items-center gap-3 rounded-2xl px-3.5 py-3">
            <span className="anim-ring inline-flex h-6 items-center gap-1 rounded-full border border-[rgb(var(--accent-rgb)/0.32)] bg-[rgb(var(--accent-rgb)/0.16)] px-2 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
              Live
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-strong text-[13px] font-semibold tracking-tight">
                Workout in progress
              </div>
              <div className="text-muted num text-[12px]">
                {summaryText(summarize(inProgress))} logged
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/workout/${inProgress.id}`)}
              className="btn-ghost-accent min-h-10 px-2 text-[13px] font-semibold"
            >
              Open →
            </button>
          </div>
        )}
      </div>

      <section className="mt-7 px-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="section-label">
            <span className="dot" />
            Recent
          </h2>
          <span className="num-mono text-faint text-[10px] tracking-[0.08em]">
            {recent.length.toString().padStart(2, '0')} /{' '}
            {state.workouts.length.toString().padStart(2, '0')}
          </span>
        </div>

        {sorted.length === 0 ? (
          <div className="glass rounded-2xl px-4 py-8 text-center">
            <p className="text-muted text-sm">No workouts yet.</p>
            <p className="text-faint mt-1 text-xs">Tap the orange button to begin.</p>
          </div>
        ) : (
          <ul className="glass divide-y divide-[var(--hairline-soft)] overflow-hidden rounded-2xl">
            {sorted.map((w, i) => {
              const sum = summarize(w);
              return (
                <li key={w.id} className="flex items-stretch">
                  <Link
                    to={`/workout/${w.id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 px-3.5 py-3 transition-colors active:bg-white/40 dark:active:bg-white/5"
                  >
                    <span className="num-mono text-faint w-5 text-center text-[10px] tracking-[0.05em]">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-strong text-[14px] font-medium tracking-tight">
                        {formatRowDate(w.date)}
                      </div>
                      <div className="text-muted num text-[12px]">{summaryText(sum)}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {w.type && (
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${workoutTypePillClasses(w.type)}`}
                        >
                          {workoutTypeLabel(w.type)}
                        </span>
                      )}
                      {w.status !== 'complete' && (
                        <span className="rounded-full border border-[rgb(var(--accent-rgb)/0.32)] bg-[rgb(var(--accent-rgb)/0.16)] px-2 py-0.5 text-[11px] font-semibold text-[var(--color-accent-700)] dark:text-[var(--color-accent-300)]">
                          In progress
                        </span>
                      )}
                    </div>
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(w)}
                    className="text-faint flex min-h-11 min-w-11 items-center justify-center px-2 text-xl leading-none transition-colors hover:text-red-500"
                    aria-label={`Delete workout from ${formatRowDate(w.date)}`}
                  >
                    ×
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
