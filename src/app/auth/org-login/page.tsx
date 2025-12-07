"use client";
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function OrgLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow">
        <CardHeader className="text-center">
          <CardTitle className="text-lg font-semibold">Legacy Organization Login Removed</CardTitle>
          <CardDescription>
            The organization-level login flow has been removed. Please sign in with your user account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-center">
            <Link href="/auth/login" className="text-primary hover:underline font-medium">Go to Login</Link>
            <div className="text-sm text-muted-foreground">Or create a new account: <Link href="/auth/signup" className="text-primary hover:underline">Sign up</Link></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
