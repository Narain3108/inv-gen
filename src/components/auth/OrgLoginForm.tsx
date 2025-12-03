
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { orgLoginSchema, OrgLoginValues } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function OrgLoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginOrg } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OrgLoginValues>({
    resolver: zodResolver(orgLoginSchema),
  });

  const onSubmit = async (data: OrgLoginValues) => {
    try {
      setIsLoading(true);
      console.debug('[OrgLoginForm] Submitting login', data);
      await loginOrg(data);
    } catch (error: any) {
      console.error('Org Login error:', error);
      toast.error(error.message || 'Failed to login to Organization.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="orgCode">Organization Code</Label>
        <Input
          id="orgCode"
          placeholder="e.g. ACME-CORP"
          {...register('orgCode')}
          disabled={isLoading}
        />
        {errors.orgCode && (
          <p className="text-sm text-destructive">{errors.orgCode.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Organization Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            {...register('password')}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Access Organization
      </Button>
    </form>
  );
}
