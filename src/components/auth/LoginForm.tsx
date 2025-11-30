/**
 * Login Form Component
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { userLoginSchema, UserLoginValues } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface LoginFormProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
}

export default function LoginForm({ onSuccess, onToggleForm }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { loginUser, organization, logoutOrg } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserLoginValues>({
    resolver: zodResolver(userLoginSchema),
  });

  const onSubmit = async (data: UserLoginValues) => {
    try {
      setIsLoading(true);
      await loginUser(data.email, data.password);
      // Success toast is handled in AuthContext
      onSuccess?.();
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!organization) {
    return (
      <div className="text-center space-y-4">
        <p className="text-muted-foreground">No Organization session found.</p>
        <Button onClick={logoutOrg} variant="outline">Go to Organization Login</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="bg-muted/50 p-3 rounded-lg text-sm text-center mb-4">
        Logging in to <strong>{organization.name}</strong>
        <button type="button" onClick={logoutOrg} className="block w-full text-xs text-primary hover:underline mt-1">
          (Change Organization)
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Your Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="you@example.com"
          {...register('email')}
          disabled={isLoading}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Your Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register('password')}
          disabled={isLoading}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>
    </form>
  );
}
