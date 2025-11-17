/**
 * Developer Settings Page
 * Cache management and debugging tools
 */

'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Trash2, RefreshCw } from 'lucide-react';
import { clearImageCache, getImageCacheStats } from '@/lib/services/cloudinary-service';
import { toast } from 'sonner';

export default function DeveloperSettingsPage() {
  const [cacheStats, setCacheStats] = useState({ count: 0, oldestUpload: null as Date | null, newestUpload: null as Date | null });

  const loadCacheStats = () => {
    const stats = getImageCacheStats();
    setCacheStats(stats);
  };

  useEffect(() => {
    loadCacheStats();
  }, []);

  const handleClearCache = () => {
    if (confirm('Are you sure you want to clear the image upload cache? This will not delete images from Cloudinary, but will allow re-uploading duplicates.')) {
      clearImageCache();
      loadCacheStats();
      toast.success('Image cache cleared successfully');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Code}
          title="Developer Settings"
          description="Cache management and debugging tools"
        />

        {/* Image Cache Management */}
        <Card>
          <CardHeader>
            <CardTitle>Image Upload Cache</CardTitle>
            <CardDescription>
              Duplicate detection cache for uploaded images. When you upload the same image again, it reuses the existing Cloudinary URL to save storage.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-muted-foreground">Cached Images</div>
                <div className="text-2xl font-bold">{cacheStats.count}</div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-muted-foreground">Oldest Upload</div>
                <div className="text-sm font-semibold">
                  {cacheStats.oldestUpload ? cacheStats.oldestUpload.toLocaleDateString() : 'N/A'}
                </div>
              </div>
              <div className="rounded-lg border p-4">
                <div className="text-sm font-medium text-muted-foreground">Latest Upload</div>
                <div className="text-sm font-semibold">
                  {cacheStats.newestUpload ? cacheStats.newestUpload.toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={loadCacheStats}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Stats
              </Button>
              <Button variant="destructive" onClick={handleClearCache}>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear Cache
              </Button>
            </div>

            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-semibold mb-2">How it works:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Each uploaded image is fingerprinted using SHA-256 hash</li>
                <li>When you upload the same file again, it reuses the existing URL</li>
                <li>Saves Cloudinary storage and reduces upload time</li>
                <li>Cache is stored in browser localStorage (max 100 images)</li>
                <li>Clearing cache doesn't delete images from Cloudinary</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

