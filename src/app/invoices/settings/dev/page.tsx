/**
 * Developer Settings Page
 * Redirects to main settings
 */

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeveloperSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.push('/invoices/settings');
  }, [router]);

  return null;
}
