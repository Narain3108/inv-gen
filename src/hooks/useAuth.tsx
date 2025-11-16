/**
 * useAuth Hook
 * Provides authentication state and methods
 */

'use client';

import { useContext } from 'react';
import { AuthContext } from '@/lib/firebase/auth-context';

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  
  return context;
};
