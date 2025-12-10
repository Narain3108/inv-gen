'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Force light theme for now. Do not remove the original logic so it can be restored later.
    setMounted(true);
    setThemeState('light');
    // Ensure root does not have dark class
    document.documentElement.classList.remove('dark');
  }, []);

  const setTheme = (newTheme: Theme) => {
    // Temporarily ignore requests to set dark theme; always persist light
    setThemeState('light');
    try {
      localStorage.setItem('theme', 'light');
    } catch (e) {
      // ignore
    }
    document.documentElement.classList.remove('dark');
  };

  const toggleTheme = () => {
    // No-op for now; keep API so components calling toggleTheme won't break.
    setTheme('light');
  };

  // Always provide context, even during SSR
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
