import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applyTheme,
  loadTheme,
  saveTheme,
  type ThemeColor,
  type ThemeMode,
  type ThemePreferences,
} from '../lib/theme';

interface ThemeContextValue {
  prefs: ThemePreferences;
  setColor: (color: ThemeColor) => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<ThemePreferences>(loadTheme);

  useEffect(() => {
    applyTheme(prefs);
    saveTheme(prefs);
  }, [prefs]);

  useEffect(() => {
    if (prefs.mode !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme(prefs);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [prefs]);

  const setColor = useCallback(
    (color: ThemeColor) => setPrefs((p) => ({ ...p, color })),
    [],
  );
  const setMode = useCallback(
    (mode: ThemeMode) => setPrefs((p) => ({ ...p, mode })),
    [],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ prefs, setColor, setMode }),
    [prefs, setColor, setMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
