
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { signupSchema, SignupValues } from '@/lib/validations';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signupUser } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupValues) => {
    try {
      setIsLoading(true);
      await signupUser(data);
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-5">
        <h3 className="font-semibold text-lg">Create Account</h3>

        <FloatingLabelInput
          id="username"
          label="Username"
          {...register('username')}
          disabled={isLoading}
          error={errors.username?.message}
        />

        <FloatingLabelInput
          id="name"
          label="Your Name"
          {...register('name')}
          disabled={isLoading}
          error={errors.name?.message}
        />

        <FloatingLabelInput
          id="email"
          type="email"
          label="Your Email"
          {...register('email')}
          disabled={isLoading}
          error={errors.email?.message}
        />

        <div className="relative">
          <FloatingLabelInput
            id="password"
            type={showAdminPassword ? 'text' : 'password'}
            label="Password"
            {...register('password')}
            disabled={isLoading}
            error={errors.password?.message}
          />
          <button
            type="button"
            onClick={() => setShowAdminPassword(!showAdminPassword)}
            className="absolute right-3 top-4 text-gray-500 hover:text-gray-700"
          >
            {showAdminPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>

        <div className="relative">
          <FloatingLabelInput
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            label="Confirm Password"
            {...register('confirmPassword')}
            disabled={isLoading}
            error={errors.confirmPassword?.message}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-4 text-gray-500 hover:text-gray-700"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create Account
      </Button>
    </form>
  );
}
