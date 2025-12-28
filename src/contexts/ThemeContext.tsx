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
    // Force light mode for now (temporarily disable dark mode)
    setMounted(true);
    setThemeState('light');
    try {
      localStorage.setItem('theme', 'light');
    } catch (e) {}
    document.documentElement.classList.remove('dark');
  }, []);

  const setTheme = (_newTheme: Theme) => {
    // Ignore requests to set dark mode while disabled; keep light
    setThemeState('light');
    try {
      localStorage.setItem('theme', 'light');
    } catch (e) {}
    document.documentElement.classList.remove('dark');
  };

  const toggleTheme = () => {
    // No-op while dark mode is disabled
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
