import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { exportJSON, importJSON } from '../storage';
import {
  THEME_COLORS,
  THEME_COLOR_LABEL,
  THEME_MODES,
  THEME_MODE_LABEL,
  type ThemeColor,
} from '../lib/theme';

const COLOR_SWATCH: Record<ThemeColor, string> = {
  red: '#ff2d2d',
  orange: '#ff9500',
  yellow: '#eab308',
  green: '#1aa84f',
  blue: '#1d6fe8',
  neutral: 'linear-gradient(135deg, #0a0a0c 0% 50%, #f5f5f7 50% 100%)',
};

type Status =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export default function Settings() {
  const { state, actions } = useApp();
  const { prefs, setColor, setMode } = useTheme();
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: 'idle' });

  function handleExport() {
    exportJSON(state);
    setStatus({ kind: 'success', message: 'Export started.' });
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const next = await importJSON(file);
      const ok = window.confirm(
        `Replace your current data with ${next.lifts.length} lifts and ${next.workouts.length} workouts? This can't be undone.`,
      );
      if (!ok) {
        setStatus({ kind: 'idle' });
        return;
      }
      actions.replaceState(next);
      setStatus({
        kind: 'success',
        message: `Imported ${next.lifts.length} lifts and ${next.workouts.length} workouts.`,
      });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Import failed.',
      });
    }
  }

  return (
    <div className="mx-auto max-w-md pb-12">
      <header className="glass-bar sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2.5">
        <Link
          to="/"
          className="btn-ghost-accent -ml-1 flex min-h-11 items-center px-2 text-[15px]"
        >
          ← Home
        </Link>
        <h1 className="text-strong text-[17px] font-semibold tracking-tight">Settings</h1>
        <span className="min-w-11" />
      </header>

      <div className="flex flex-col gap-6 px-4 py-5">
        <section className="flex flex-col gap-3">
          <h2 className="text-faint px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Appearance
          </h2>
          <div className="glass rounded-2xl px-4 py-4">
            <div className="flex items-center justify-between">
              <span className="text-strong text-[14px] font-medium">Accent</span>
              <span className="text-muted text-[12px]">{THEME_COLOR_LABEL[prefs.color]}</span>
            </div>
            <div className="mt-3 grid grid-cols-6 gap-2">
              {THEME_COLORS.map((color) => {
                const active = prefs.color === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setColor(color)}
                    aria-label={`Use ${THEME_COLOR_LABEL[color]} theme`}
                    aria-pressed={active}
                    className={`relative aspect-square rounded-full border transition-transform active:scale-95 ${
                      active
                        ? 'border-[var(--text-strong)] ring-2 ring-[var(--color-accent-500)]/40'
                        : 'border-[var(--hairline)]'
                    }`}
                    style={{
                      background: COLOR_SWATCH[color],
                      backgroundSize: 'cover',
                    }}
                  />
                );
              })}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-strong text-[14px] font-medium">Mode</span>
              <span className="text-muted text-[12px]">{THEME_MODE_LABEL[prefs.mode]}</span>
            </div>
            <div
              role="radiogroup"
              aria-label="Theme mode"
              className="pill-segment mt-2 grid grid-cols-3 gap-1 rounded-full p-1"
            >
              {THEME_MODES.map((mode) => {
                const active = prefs.mode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setMode(mode)}
                    className={`min-h-9 rounded-full text-[13px] font-medium transition-colors ${
                      active ? 'pill-segment-active' : 'text-muted'
                    }`}
                  >
                    {THEME_MODE_LABEL[mode]}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-faint px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Backup
          </h2>
          <div className="glass rounded-2xl px-4 py-4">
            <p className="text-muted text-[13px] leading-relaxed">
              All workout data is stored on this device only. Use export to back up or
              move to another device.
            </p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="btn-accent min-h-12 w-full rounded-xl text-[15px] font-semibold tracking-tight"
              >
                Export workouts.json
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="btn-glass min-h-12 w-full rounded-xl text-[15px] font-semibold tracking-tight"
              >
                Import workouts.json
              </button>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFile}
              className="hidden"
              aria-hidden="true"
            />
          </div>
        </section>

        {status.kind === 'success' && (
          <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-[13px] text-emerald-700 dark:text-emerald-300">
            {status.message}
          </p>
        )}
        {status.kind === 'error' && (
          <p className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-[13px] text-red-700 dark:text-red-300">
            {status.message}
          </p>
        )}

        <section>
          <h2 className="text-faint mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
            Stats
          </h2>
          <div className="glass-quiet rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between py-1 text-[13px]">
              <span className="text-muted">Lifts</span>
              <span className="text-strong font-medium tabular-nums">
                {state.lifts.length}
              </span>
            </div>
            <div className="flex items-center justify-between py-1 text-[13px]">
              <span className="text-muted">Workouts</span>
              <span className="text-strong font-medium tabular-nums">
                {state.workouts.length}
              </span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
