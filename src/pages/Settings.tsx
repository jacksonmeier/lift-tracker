import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { exportJSON, importJSON } from '../storage';

type Status =
  | { kind: 'idle' }
  | { kind: 'success'; message: string }
  | { kind: 'error'; message: string };

export default function Settings() {
  const { state, actions } = useApp();
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
