
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orgSignupSchema, OrgSignupValues } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function OrgSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { signupOrg } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgSignupValues>({
    resolver: zodResolver(orgSignupSchema),
  });

  const onSubmit = async (data: OrgSignupValues) => {
    try {
      setIsLoading(true);
      await signupOrg(data);
    } catch (error: any) {
      console.error('Org Signup error:', error);
      toast.error(error.message || 'Failed to create Organization.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4 border-b pb-4">
        <h3 className="font-semibold text-lg">Organization Details</h3>
        <div className="space-y-2">
          <Label htmlFor="orgName">Organization Name</Label>
          <Input
            id="orgName"
            placeholder="Acme Corp"
            {...register('orgName')}
            disabled={isLoading}
          />
          {errors.orgName && <p className="text-sm text-destructive">{errors.orgName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgCode">Organization Code (Login ID)</Label>
          <Input
            id="orgCode"
            placeholder="ACME-CORP"
            {...register('orgCode')}
            disabled={isLoading}
          />
          {errors.orgCode && <p className="text-sm text-destructive">{errors.orgCode.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="orgPassword">Organization Shared Password</Label>
          <Input
            id="orgPassword"
            type="password"
            placeholder="••••••••"
            {...register('orgPassword')}
            disabled={isLoading}
          />
          {errors.orgPassword && <p className="text-sm text-destructive">{errors.orgPassword.message}</p>}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Super Admin Details</h3>
        <div className="space-y-2">
          <Label htmlFor="adminName">Your Name</Label>
          <Input
            id="adminName"
            placeholder="John Doe"
            {...register('adminName')}
            disabled={isLoading}
          />
          {errors.adminName && <p className="text-sm text-destructive">{errors.adminName.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="adminEmail">Your Email</Label>
          <Input
            id="adminEmail"
            type="email"
            placeholder="john@acme.com"
            {...register('adminEmail')}
            disabled={isLoading}
          />
          {errors.adminEmail && <p className="text-sm text-destructive">{errors.adminEmail.message}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="adminPassword">Password</Label>
            <Input
              id="adminPassword"
              type="password"
              placeholder="••••••••"
              {...register('adminPassword')}
              disabled={isLoading}
            />
            {errors.adminPassword && <p className="text-sm text-destructive">{errors.adminPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmAdminPassword">Confirm Password</Label>
            <Input
              id="confirmAdminPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmAdminPassword')}
              disabled={isLoading}
            />
            {errors.confirmAdminPassword && <p className="text-sm text-destructive">{errors.confirmAdminPassword.message}</p>}
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Organization & Admin Account
      </Button>
    </form>
  );
}
