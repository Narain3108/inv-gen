'use client';

import React, { useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuditList from '@/components/audit/AuditList';
import { companiesApi } from '@/lib/api/companies.api';

export default function AdminAuditPage() {
  const { user, loading } = useAuth();
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const isAdminOrSuper = useMemo(() => {
    if (!user) return false;
    return user.role === 'super_admin' || user.role === 'admin';
  }, [user]);

  const allowedCompanies = user?.allowedCompanyIds || [];

  // Fetch company list only for super_admin or admin to show names
  const [companies, setCompanies] = useState<any[]>([]);
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!user) return;
      try {
        // Only fetch when super_admin or admin
        if (user.role === 'super_admin') {
          const all = await companiesApi.getAll();
          if (mounted) setCompanies(all || []);
        } else if (user.role === 'admin') {
          // fetch only allowed companies by IDs
          const fetched: any[] = [];
          for (const cid of allowedCompanies) {
            try {
              const c = await companiesApi.getById(cid);
              fetched.push(c);
            } catch (e) {
              // ignore missing
            }
          }
          if (mounted) setCompanies(fetched);
        }
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, [user]);

  if (loading) return <div className="p-4">Loading...</div>;
  if (!user) return <div className="p-4">Unauthorized</div>;

  if (!isAdminOrSuper) {
    return <div className="p-4 text-gray-600">You do not have access to view audit logs.</div>;
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Activity / Audit Logs</h2>
        <div>
          <select value={selectedCompany || ''} onChange={(e) => setSelectedCompany(e.target.value || null)} className="border rounded p-2">
            <option value="">All companies</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <AuditList companyId={selectedCompany} />
    </div>
  );
}
