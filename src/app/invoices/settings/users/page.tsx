'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/lib/api/users.api';
import { User } from '@/types';
import { UserList } from '@/components/settings/UserList';
import { UserForm } from '@/components/settings/UserForm';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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

  if (authLoading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage users, roles, and company access.
          </p>
        </div>
        <Button onClick={handleCreateUser}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      <UserList 
        users={users} 
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
  );
}
