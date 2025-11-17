/**
 * Settings Page - Navigation to different settings sections
 */

'use client';

import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Building2, Tag, Palette, FileText } from 'lucide-react';
import Link from 'next/link';

const settingsLinks = [
  {
    title: 'Company Management',
    description: 'Manage your company profiles and details',
    icon: Building2,
    href: '/invoices/settings/company',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    title: 'Product Categories',
    description: 'Global product categories for auto-filling GST rates',
    icon: Tag,
    href: '/invoices/settings/categories',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
];

function SettingsContent() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Manage your application settings and preferences"
        icon={Settings}
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="h-full hover:shadow-lg transition-all cursor-pointer hover:border-primary/50">
              <CardHeader>
                <div className={`p-3 rounded-lg ${link.bgColor} w-fit mb-2`}>
                  <link.icon className={`h-6 w-6 ${link.color}`} />
                </div>
                <CardTitle className="text-lg">{link.title}</CardTitle>
                <CardDescription>{link.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <SettingsContent />
    </DashboardLayout>
  );
}

