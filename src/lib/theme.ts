export type ThemeColor = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'neutral';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemePreferences {
  color: ThemeColor;
  mode: ThemeMode;
}

const STORAGE_KEY = 'lift-tracker-theme';

export const DEFAULT_THEME: ThemePreferences = { color: 'orange', mode: 'system' };

export const THEME_COLORS: readonly ThemeColor[] = [
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'neutral',
] as const;

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark', 'system'] as const;

export const THEME_COLOR_LABEL: Record<ThemeColor, string> = {
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  neutral: 'Neutral',
};

export const THEME_MODE_LABEL: Record<ThemeMode, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
};

function isThemeColor(value: unknown): value is ThemeColor {
  return typeof value === 'string' && (THEME_COLORS as readonly string[]).includes(value);
}

function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}

export function loadTheme(): ThemePreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THEME;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return DEFAULT_THEME;
    const v = parsed as Record<string, unknown>;
    return {
      color: isThemeColor(v.color) ? v.color : DEFAULT_THEME.color,
      mode: isThemeMode(v.mode) ? v.mode : DEFAULT_THEME.mode,
    };
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveTheme(prefs: ThemePreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function resolveMode(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode;
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(prefs: ThemePreferences): void {
  const root = document.documentElement;
  root.dataset.theme = prefs.color;
  root.dataset.mode = resolveMode(prefs.mode);
}
