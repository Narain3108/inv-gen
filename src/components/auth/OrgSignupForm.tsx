
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orgSignupSchema, OrgSignupValues } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function OrgSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOrgPassword, setShowOrgPassword] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
          <div className="relative">
            <Input
              id="orgPassword"
              type={showOrgPassword ? "text" : "password"}
              placeholder="••••••••"
              {...register('orgPassword')}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowOrgPassword(!showOrgPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showOrgPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
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
            <div className="relative">
              <Input
                id="adminPassword"
                type={showAdminPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register('adminPassword')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowAdminPassword(!showAdminPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.adminPassword && <p className="text-sm text-destructive">{errors.adminPassword.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmAdminPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmAdminPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register('confirmAdminPassword')}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
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
