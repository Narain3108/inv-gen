
'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { AppDataProvider } from '@/contexts/AppDataContext';
import { QueryProvider } from '@/lib/query';
import { Toaster } from 'sonner';
import { useCompaniesSync } from '@/hooks/useCompanies';

function StateSync() {
  useCompaniesSync();
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <StateSync />
      <ThemeProvider>
        <AuthProvider>
          <AppDataProvider>
            {children}
            <Toaster
              position="top-right"
              richColors
              closeButton
              toastOptions={{
                className: 'dark:bg-gray-800 dark:text-white dark:border-gray-700',
              }}
            />
          </AppDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryProvider>
  );
}
