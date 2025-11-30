
import OrgSignupForm from '@/components/auth/OrgSignupForm';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-primary/5 to-accent/5 p-4 py-8">
      <Card className="w-full max-w-lg shadow-xl border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-accent shadow-lg">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Create Organization</CardTitle>
          <CardDescription>
            Set up your organization and super admin account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <OrgSignupForm />
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Already have an organization?{' '}
            <Link href="/auth/org-login" className="text-primary hover:underline font-medium">
              Login here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
