'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/lib/api/users.api';
import { DashboardLayout } from '@/components/layout';
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
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'employee'>('all');

  useEffect(() => {
    if (!authLoading && currentUser) {
      if (currentUser.role !== 'super_admin') {
        toast.error('Unauthorized access');
        router.push('/invoices/dashboard');
        return;
      }
      fetchUsers();
    }
  }, [currentUser, authLoading, router]);

  const fetchUsers = async () => {
    try {
      if (!currentUser?.organizationId) return;
      setLoading(true);
      const data = await usersApi.getOrgUsers(currentUser.organizationId);
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
          role: data.role,
          allowedCompanyIds: data.allowedCompanyIds,
        });
        toast.success('User updated successfully');
      } else {
        if (!data.password) {
          toast.error('Password is required for new users');
          return;
        }
        await usersApi.create({
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          allowedCompanyIds: data.allowedCompanyIds,
          organizationId: currentUser?.organizationId,
        });
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
      return matchesSearch && matchesRole;
    }),
  [users, searchTerm, roleFilter]);

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

  if (authLoading) return <div>Loading...</div>;

  return (
    <DashboardLayout>
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PageHeader
          title="User Management"
          description="Manage roles, permissions, and company access for your organization."
          icon={UsersIcon}
        />
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleRefresh} className="gap-2">
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={handleCreateUser} className="gap-2">
            <Plus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Quick Filters</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative w-full lg:flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}>
            <SelectTrigger className="w-full lg:w-[220px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="super_admin">Super Admins</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="employee">Employees</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground lg:w-auto">
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
                : 'Add a new user to the organization.'}
            </DialogDescription>
          </DialogHeader>
          <UserForm 
            user={selectedUser} 
            onSubmit={handleFormSubmit} 
            onCancel={() => setIsDialogOpen(false)} 
          />
        </DialogContent>
      </Dialog>
    </div>
    </DashboardLayout>
  );
}
