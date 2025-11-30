' use client';
import OrgLoginForm from '@/components/auth/OrgLoginForm';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function OrgLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4">
      <Card className="w-full max-w-md shadow-xl border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Organization Login</CardTitle>
          <CardDescription>
            Enter your Organization Code and Shared Password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgLoginForm />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            New here?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-medium">
              Create an Organization
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
