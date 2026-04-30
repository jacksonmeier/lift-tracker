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
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
        <Link to="/" className="min-h-11 px-2 -ml-2 text-base text-blue-600 flex items-center">
          ← Home
        </Link>
        <h1 className="text-lg font-semibold">Settings</h1>
        <span className="min-w-11" />
      </header>

      <div className="flex flex-col gap-6 px-4 py-4">
        <section className="flex flex-col gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Backup
          </h2>
          <p className="text-sm text-gray-600">
            All workout data is stored on this device only. Use export to back up or move
            to another device.
          </p>
          <button
            type="button"
            onClick={handleExport}
            className="min-h-12 w-full rounded-lg bg-blue-600 text-base font-semibold text-white active:bg-blue-700"
          >
            Export workouts.json
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="min-h-12 w-full rounded-lg border border-gray-300 bg-white text-base font-semibold text-gray-800 active:bg-gray-50"
          >
            Import workouts.json
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={handleFile}
            className="hidden"
            aria-hidden="true"
          />
        </section>

        {status.kind === 'success' && (
          <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
            {status.message}
          </p>
        )}
        {status.kind === 'error' && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">
            {status.message}
          </p>
        )}

        <section className="text-xs text-gray-500">
          <div>
            Lifts: <span className="tabular-nums">{state.lifts.length}</span>
          </div>
          <div>
            Workouts: <span className="tabular-nums">{state.workouts.length}</span>
          </div>
        </section>
      </div>
    </div>
  );
}
