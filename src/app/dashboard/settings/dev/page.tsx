/**
 * Developer Settings Page
 * For testing and loading demo data
 */

'use client';

import React, { useState } from 'react';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/firebase/auth-context';
import { seedDemoData, clearDemoData } from '@/lib/seed-database';
import { toast } from 'sonner';
import { Database, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';

function DeveloperSettingsContent() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleLoadDemoData = async () => {
    if (!user) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await seedDemoData(user.uid);
      
      if (response.success) {
        setResult({ type: 'success', message: response.message });
        toast.success('Demo data loaded successfully!');
      } else {
        setResult({ type: 'error', message: response.message });
        toast.error(response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load demo data';
      setResult({ type: 'error', message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAllData = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete ALL data? This action cannot be undone!'
    );

    if (!confirmed) return;

    setIsLoading(true);
    setResult(null);

    try {
      const response = await clearDemoData(user.uid);
      
      if (response.success) {
        setResult({ type: 'success', message: response.message });
        toast.success('All data cleared successfully!');
      } else {
        setResult({ type: 'error', message: response.message });
        toast.error(response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to clear data';
      setResult({ type: 'error', message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Developer Settings</h1>
        <p className="text-muted-foreground">
          Tools for testing and development
        </p>
      </div>

      {/* Result Alert */}
      {result && (
        <Card className={result.type === 'error' ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              {result.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
              )}
              <p className={`text-sm ${result.type === 'error' ? 'text-red-700' : 'text-green-700'}`}>
                {result.message}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Data Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Demo Data
          </CardTitle>
          <CardDescription>
            Load sample data for testing the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h3 className="font-medium">What will be created:</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• 1 Company (TechVista Solutions Pvt Ltd)</li>
              <li>• 5 Products/Services (Web Dev, Mobile App, UI/UX, etc.)</li>
              <li>• 5 Clients (Acme Corp, GlobalTech, etc.)</li>
              <li>• 8-15 Sample Invoices (with various payment statuses)</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleLoadDemoData}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-4 w-4" />
                  Load Demo Data
                </>
              )}
            </Button>
          </div>

          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  This will only work if you haven't created any companies yet. If you already have data,
                  clear it first before loading demo data.
                </p>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      {/* Clear Data Card */}
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Permanently delete all your data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            This will permanently delete all companies, products, clients, and invoices.
            This action cannot be undone!
          </p>

          <Button
            variant="destructive"
            onClick={handleClearAllData}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DeveloperSettingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <DeveloperSettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
