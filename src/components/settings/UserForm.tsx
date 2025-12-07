'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppData } from '@/contexts/AppDataContext';
import { toast } from 'sonner';

interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

function Checkbox({ id, checked = false, onCheckedChange, className }: CheckboxProps) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      className={`h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary ${className}`}
    />
  );
}

const userFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
  role: z.enum(['super_admin', 'admin', 'employee']),
  allowedCompanyIds: z.array(z.string()),
});

type UserFormData = z.infer<typeof userFormSchema>;

interface UserFormProps {
  user?: User;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  // If provided, use these companies as available options (useful to limit admin choices)
  availableCompanies?: Company[];
}

export function UserForm({ user, onSubmit, onCancel, availableCompanies }: UserFormProps) {
  const { companies: globalCompanies } = useAppData();
  const companies = availableCompanies || globalCompanies;
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      password: '',
      role: (user?.role as any) || 'employee',
      allowedCompanyIds: user?.allowedCompanyIds || [],
    },
  });

  // Reset form when user prop changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name,
        email: user.email,
        password: '',
        role: (user.role as any) || 'employee',
        allowedCompanyIds: user.allowedCompanyIds || [],
      });
    } else {
      reset({
        name: '',
        email: '',
        password: '',
        role: 'employee',
        allowedCompanyIds: [],
      });
    }
  }, [user, reset]);

  const selectedRole = watch('role');
  const selectedCompanyIds = watch('allowedCompanyIds');

  const handleCompanyToggle = (companyId: string) => {
    const current = selectedCompanyIds || [];
    if (current.includes(companyId)) {
      setValue('allowedCompanyIds', current.filter(id => id !== companyId), { shouldDirty: true });
    } else {
      setValue('allowedCompanyIds', [...current, companyId], { shouldDirty: true });
    }
  };

  const handleSelectAllCompanies = (checked: boolean) => {
    if (checked) {
      setValue('allowedCompanyIds', companies.map(c => c.id), { shouldDirty: true });
    } else {
      setValue('allowedCompanyIds', [], { shouldDirty: true });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" {...register('name')} placeholder="John Doe" />
          {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            {...register('email')} 
            placeholder="john@example.com" 
            disabled={isEditing} 
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
        </div>

        {!isEditing && (
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                {...register('password')} 
                placeholder="******" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Select 
            onValueChange={(value) => setValue('role', value as any, { shouldDirty: true })} 
            value={selectedRole}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="employee">Employee</SelectItem>
            </SelectContent>
          </Select>
          {errors.role && <p className="text-sm text-red-500">{errors.role.message}</p>}
        </div>

        {selectedRole !== 'super_admin' && (
          <div className="grid gap-2">
            <Label>Allowed Companies</Label>
            <div className="border rounded-md p-4 space-y-3 max-h-60 overflow-y-auto">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox 
                  id="select-all" 
                  checked={selectedCompanyIds?.length === companies.length && companies.length > 0}
                  onCheckedChange={handleSelectAllCompanies}
                />
                <Label htmlFor="select-all" className="font-bold cursor-pointer">Select All</Label>
              </div>
              {companies.map((company) => (
                <div key={company.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`company-${company.id}`} 
                    checked={selectedCompanyIds?.includes(company.id)}
                    onCheckedChange={() => handleCompanyToggle(company.id)}
                  />
                  <Label htmlFor={`company-${company.id}`} className="cursor-pointer">{company.name}</Label>
                </div>
              ))}
              {companies.length === 0 && (
                <p className="text-sm text-muted-foreground">No companies available.</p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Select the companies this user can access.
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
        </Button>
      </div>
    </form>
  );
}
