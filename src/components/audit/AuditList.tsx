'use client';

import React, { useEffect, useState } from 'react';
import AuditItem from './AuditItem';
import { auditApi } from '@/lib/api/audit.api';

interface Props {
  companyId?: string | null;
}

export default function AuditList({ companyId }: Props) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = companyId ? await auditApi.getByCompany(companyId) : await auditApi.getAll();
        if (!mounted) return;
        setItems(res || []);
      } catch (e: any) {
        console.error('Failed to load audit logs', e);
        setError(e?.message || 'Failed to load audit logs');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [companyId]);

  if (loading) return <div className="p-4">Loading audit logs...</div>;
  if (error) return <div className="p-4 text-red-600">{error}</div>;
  if (items.length === 0) return <div className="p-4 text-gray-600">No audit entries found.</div>;

  return (
    <div className="space-y-3">
      {items.map((it) => (
        <AuditItem key={it.id || `${it.resourceType}-${it.resourceId}-${it.action}`} item={it} />
      ))}
    </div>
  );
}
