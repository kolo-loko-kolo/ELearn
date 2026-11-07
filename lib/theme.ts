export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'elearn_theme';

/**
 * Returns the currently stored theme mode or 'dark' by default (ELearn Notion/Linear dark aesthetic)
 */
export function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage may be disabled
  }
  return 'dark';
}

/**
 * Applies the given theme mode by toggling the 'dark' class on <html>
 */
export function applyTheme(mode: ThemeMode): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const root = document.documentElement;
  let isDark = false;

  if (mode === 'dark') {
    isDark = true;
  } else if (mode === 'light') {
    isDark = false;
  } else if (mode === 'system') {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }

  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // ignore
  }

  // Dispatch a custom event so other components can react
  window.dispatchEvent(new CustomEvent('elearn-theme-change', { detail: { mode } }));
}

/**
 * Initialize theme listener for system preference changes
 */
export function initThemeListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

  const handleChange = () => {
    const currentMode = getStoredTheme();
    if (currentMode === 'system') {
      applyTheme('system');
    }
  };

  try {
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  } catch {
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }
}
