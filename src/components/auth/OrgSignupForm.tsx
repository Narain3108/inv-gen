
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
import { GoogleLogin } from '@react-oauth/google';

export default function SignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signupUser, googleLoginUser } = useAuth();

  const {
    register,
    handleSubmit,
    getValues,
    trigger,
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

  const handleGoogleSuccess = async (credentialResponse: any) => {
    // Validate username and name before proceeding
    const isValid = await trigger(["username", "name"]);
    if (!isValid) {
      toast.error("Please provide your Username and Name above first.");
      return;
    }
    
    try {
      setIsLoading(true);
      const { username, name } = getValues();
      await googleLoginUser(credentialResponse.credential, username, name);
    } catch (error: any) {
      console.error('Google signup error:', error);
      toast.error(error.message || 'Failed to create account with Google.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-5">
        <h3 className="font-semibold text-lg">Create Account</h3>
        <p className="text-sm text-muted-foreground mb-4">
          For Google Sign up, just fill Username and Your Name and click the Google button below.
        </p>

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
        Create Account with Password
      </Button>

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-muted-foreground/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>
      
      <div className="flex justify-center w-full pb-4">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => toast.error('Google Signup Failed')}
          useOneTap
        />
      </div>
    </form>
  );
}
