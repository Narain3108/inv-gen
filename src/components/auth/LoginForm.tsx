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
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { GoogleLogin } from '@react-oauth/google';

interface LoginFormProps {
  onSuccess?: () => void;
  onToggleForm?: () => void;
}

export default function LoginForm({ onSuccess, onToggleForm }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { loginUser, googleLoginUser } = useAuth();

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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      await googleLoginUser(credentialResponse.credential);
      onSuccess?.();
    } catch (error: any) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Failed to login with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="bg-muted/50 p-3 rounded-lg text-sm text-center mb-4">
        Sign in to your account
      </div>
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
          type={showPassword ? "text" : "password"}
          label="Your Password"
          {...register('password')}
          disabled={isLoading}
          error={errors.password?.message}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-4 text-gray-500 hover:text-gray-700"
        >
          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <Button type="submit" className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Sign In
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      
      <div className="flex justify-center w-full">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google Login Failed')}
          useOneTap
        />
      </div>
    </form>
  );
}

