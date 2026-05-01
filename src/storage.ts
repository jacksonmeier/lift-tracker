import type { AppState } from './types';

const STORAGE_KEY = 'lift-tracker-data';

export function emptyState(): AppState {
  return { lifts: [], workouts: [], biometrics: [], schemaVersion: 1 };
}

// Pre-biometrics saves don't have the field — fill it in before validation so
// existing data loads cleanly. New writes always include the field.
function patchLegacy(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value;
  const v = value as Record<string, unknown>;
  if (v.biometrics === undefined) {
    return { ...v, biometrics: [] };
  }
  return v;
}

function isAppState(value: unknown): value is AppState {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    Array.isArray(v.lifts) &&
    Array.isArray(v.workouts) &&
    Array.isArray(v.biometrics) &&
    v.schemaVersion === 1
  );
}

export function load(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = patchLegacy(JSON.parse(raw));
    if (!isAppState(parsed)) {
      console.warn('lift-tracker: stored data failed validation, starting fresh');
      return emptyState();
    }
    return parsed;
  } catch (err) {
    console.warn('lift-tracker: failed to load state, starting fresh', err);
    return emptyState();
  }
}

export function save(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportJSON(state: AppState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `workouts-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importJSON(file: File): Promise<AppState> {
  const text = await file.text();
  const parsed = patchLegacy(JSON.parse(text));
  if (!isAppState(parsed)) {
    throw new Error('Invalid file: not a lift-tracker export');
  }
  return parsed;
}
