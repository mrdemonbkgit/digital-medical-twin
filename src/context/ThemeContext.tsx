import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { Theme, ResolvedTheme } from '@/types/theme';

const STORAGE_KEY = 'theme-preference';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => Promise<void>;
  isLoading: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    return getSystemTheme();
  }
  return theme;
}

function applyTheme(resolvedTheme: ResolvedTheme) {
  document.documentElement.setAttribute('data-theme', resolvedTheme);
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Initialize from localStorage for instant load (avoid flash)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system';
    return (localStorage.getItem(STORAGE_KEY) as Theme) || 'system';
  });
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => resolveTheme(theme));
  const [isLoading, setIsLoading] = useState(true);

  // Apply theme immediately on mount and when it changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [theme]);

  // Listen for system preference changes when theme is 'system'
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const resolved = getSystemTheme();
      setResolvedTheme(resolved);
      applyTheme(resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // Load theme from database on mount (if authenticated)
  useEffect(() => {
    async function loadThemeFromDb() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data } = await supabase
          .from('user_settings')
          .select('theme')
          .eq('user_id', user.id)
          .maybeSingle();

        if (data?.theme) {
          const dbTheme = data.theme as Theme;
          setThemeState(dbTheme);
          localStorage.setItem(STORAGE_KEY, dbTheme);
        }
      } catch {
        // Ignore errors, use localStorage value
      } finally {
        setIsLoading(false);
      }
    }

    loadThemeFromDb();
  }, []);

  const setTheme = useCallback(async (newTheme: Theme) => {
    // Update state and localStorage immediately for responsiveness
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);

    // Persist to database if authenticated
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('user_settings').upsert(
          {
            user_id: user.id,
            theme: newTheme,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );
      }
    } catch {
      // Ignore database errors - localStorage already updated
    }
  }, []);

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
    isLoading,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
