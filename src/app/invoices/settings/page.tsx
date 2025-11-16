/**
 * Settings Page - Redirects to Company Management
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/invoices/settings/company');
  }, [router]);

  return null;
}
