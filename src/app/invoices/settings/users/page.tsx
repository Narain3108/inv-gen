'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/lib/api/users.api';
import { DashboardLayout } from '@/components/layout';
import { useAppData } from '@/contexts/AppDataContext';
import { User } from '@/types';
import { UserList } from '@/components/settings/UserList';
import { UserForm } from '@/components/settings/UserForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PageHeader from '@/components/shared/PageHeader';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, RefreshCcw, Search, ShieldCheck, Users as UsersIcon, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export default function UsersPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const { companies, companiesLoading } = useAppData();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'employee'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');

  useEffect(() => {
    if (!authLoading && currentUser) {
      // Allow both super_admin and admin to access user management. Admins have limited scope.
      if (currentUser.role !== 'super_admin' && currentUser.role !== 'admin') {
        toast.error('Unauthorized access');
        router.push('/invoices/dashboard');
        return;
      }
      fetchUsers();
    }
  }, [currentUser, authLoading, router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Backend implements RBAC-aware filtering for the requesting user
      const data = await usersApi.getAll();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setSelectedUser(undefined);
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleRefresh = () => {
    fetchUsers();
    toast.info('User list refreshed');
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (selectedUser) {
        await usersApi.update(selectedUser.id, {
          name: data.name,
          role: currentUser?.role === 'admin' ? 'employee' : data.role,
          allowedCompanyIds: currentUser?.role === 'admin'
            ? (data.allowedCompanyIds || []).filter((c: string) => (currentUser.allowedCompanyIds || []).includes(c))
            : data.allowedCompanyIds,
        });
        toast.success('User updated successfully');
      } else {
        if (!data.password) {
          toast.error('Password is required for new users');
          return;
        }
        // Enforce admin constraints client-side for better UX; backend also enforces
        const payload: any = {
          name: data.name,
          email: data.email,
          password: data.password,
          role: currentUser?.role === 'admin' ? 'employee' : data.role,
          allowedCompanyIds: currentUser?.role === 'admin'
            ? (data.allowedCompanyIds || []).filter((c: string) => (currentUser.allowedCompanyIds || []).includes(c))
            : data.allowedCompanyIds,
          organizationId: currentUser?.organizationId,
        };
        await usersApi.create(payload);
        toast.success('User created successfully');
      }
      setIsDialogOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Operation failed:', error);
      toast.error(error.message || 'Operation failed');
    }
  };

  const roleCounts = useMemo(() =>
    users.reduce(
      (acc, user) => {
        acc.total += 1;
        if (user.role === 'super_admin') acc.super_admin += 1;
        if (user.role === 'admin') acc.admin += 1;
        if (user.role === 'employee') acc.employee += 1;
        return acc;
      },
      { total: 0, super_admin: 0, admin: 0, employee: 0 }
    ),
    [users]);

  const filteredUsers = useMemo(() =>
    users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
      const hasCompanies = user.allowedCompanyIds?.length > 0;
      const matchesCompany =
        companyFilter === 'all'
          ? true
          : companyFilter === 'unassigned'
            ? !hasCompanies
            : user.role === 'super_admin' || user.allowedCompanyIds?.includes(companyFilter);

      return matchesSearch && matchesRole && matchesCompany;
    }),
    [users, searchTerm, roleFilter, companyFilter]);

  const stats = useMemo(() => ([
    {
      label: 'Total Users',
      value: roleCounts.total,
      icon: UsersIcon,
      badge: `${filteredUsers.length} visible`,
    },
    {
      label: 'Super Admins',
      value: roleCounts.super_admin,
      icon: ShieldCheck,
    },
    {
      label: 'Admins',
      value: roleCounts.admin,
      icon: ShieldCheck,
    },
    {
      label: 'Employees',
      value: roleCounts.employee,
      icon: UserPlus,
    },
  ]), [roleCounts, filteredUsers.length]);

  // Show loading skeleton while auth or users are loading
  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          {/* Header Skeleton */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-28" />
            </div>
          </div>

          {/* Stats Cards Skeleton */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Filters Skeleton */}
          <Card>
            <CardHeader className="pb-4">
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4 lg:flex-row">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-full lg:w-[160px]" />
              <Skeleton className="h-10 w-full lg:w-[220px]" />
            </CardContent>
          </Card>

          {/* Table Skeleton */}
          <Card>
            <div className="p-4 space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 flex-1" />
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <PageHeader
            title="User Management"
            description="Manage roles, permissions, and company access for your organization."
            icon={UsersIcon}
          />
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleRefresh} className="gap-2" disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={handleCreateUser} className="gap-2">
              <Plus className="h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                <stat.icon className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                {stat.badge && (
                  <Badge variant="outline" className="mt-2">{stat.badge}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Quick Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="relative w-full lg:flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid gap-3 w-full sm:grid-cols-2 lg:w-auto lg:flex lg:flex-row">
              <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
                <SelectTrigger className="w-full lg:w-[160px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="super_admin">Super Admins</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="employee">Employees</SelectItem>
                </SelectContent>
              </Select>
              <Select value={companyFilter} onValueChange={(value) => setCompanyFilter(value)}>
                <SelectTrigger className="w-full lg:w-[220px]">
                  <SelectValue placeholder="Filter by company" />
                </SelectTrigger>
                <SelectContent className="max-h-64 overflow-y-auto">
                  <SelectItem value="all">All companies</SelectItem>
                  <SelectItem value="unassigned">No company assigned</SelectItem>
                  {companies.length === 0 && (
                    <SelectItem value="__empty" disabled>
                      {companiesLoading ? 'Loading companies...' : 'No companies found'}
                    </SelectItem>
                  )}
                  {companies.map((company) => (
                    <SelectItem key={company.id} value={company.id}>
                      {company.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground lg:w-auto text-center lg:text-left whitespace-nowrap">
              Showing <span className="font-semibold text-foreground">{filteredUsers.length}</span> of{' '}
              <span className="font-semibold text-foreground">{users.length}</span> users
            </div>
          </CardContent>
        </Card>

        <UserList
          users={filteredUsers}
          onEdit={handleEditUser}
        />

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
              <DialogDescription>
                {selectedUser
                  ? 'Update user details and permissions.'
                  : ''}
              </DialogDescription>
            </DialogHeader>
            <UserForm
              user={selectedUser}
              onSubmit={handleFormSubmit}
              onCancel={() => setIsDialogOpen(false)}
              onPasswordChange={async (userId, newPassword) => {
                await usersApi.changePassword(userId, newPassword);
              }}
              // If current user is admin, restrict available companies to their allowed set
              availableCompanies={currentUser?.role === 'admin'
                ? companies.filter(c => (currentUser.allowedCompanyIds || []).includes(c.id))
                : companies}
            />
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
