/**
 * Reports Page
 */

'use client';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';

export default function ReportsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="space-y-6">
          <PageHeader
            title="Reports & Analytics"
            description="View your business insights and reports"
          />

          <div className="rounded-lg border border-dashed p-8 text-center">
            <p className="text-muted-foreground">
              Reports and analytics will be available in Phase 10
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
