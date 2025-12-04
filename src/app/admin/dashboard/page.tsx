
'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import PageHeader from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Shield, Trash2, Edit, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useCompanies } from '@/hooks/useCompanies';
import { organizationApi } from '@/lib/api/organization.api';
import { User } from '@/types';
import { toast } from 'sonner';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { subUserFormSchema, SubUserFormValues } from '@/lib/validations';

export default function UserManagementPage() {
  const { user, organization } = useAuth();
  const { companies, loadCompanies } = useCompanies();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Load users and companies
  useEffect(() => {
    const loadData = async () => {
      if (!organization) return;
      try {
        await loadCompanies();
        const usersData = await organizationApi.getUsers(organization.id);
        setUsers(usersData);
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [organization, loadCompanies]);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await organizationApi.deleteUser(userId);
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PageHeader
          icon={Users}
          title="User Management"
          description="Manage users, roles, and company access"
        >
          <Button onClick={() => { setEditingUser(null); setIsDialogOpen(true); }}>
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </PageHeader>

        <Card>
          <CardHeader>
            <CardTitle>Organization Users</CardTitle>
            <CardDescription>
              List of all users in {organization?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'super_admin' ? 'default' : u.role === 'admin' ? 'secondary' : 'outline'}>
                        {u.role.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {u.role === 'super_admin' ? (
                        <span className="text-muted-foreground italic">All Companies</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.allowedCompanyIds.map(id => {
                            const company = companies.find(c => c.id === id);
                            return company ? (
                              <Badge key={id} variant="outline" className="text-xs">
                                {company.name}
                              </Badge>
                            ) : null;
                          })}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {u.role !== 'super_admin' && (
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <UserDialog 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          companies={companies}
          orgId={organization?.id || ''}
          onSuccess={(newUser: User) => {
            setUsers([...users, newUser]);
            setIsDialogOpen(false);
          }}
        />
      </div>
    </DashboardLayout>
  );
}

function UserDialog({ open, onOpenChange, companies, orgId, onSuccess }: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void; 
  companies: any[]; 
  orgId: string; 
  onSuccess: (user: User) => void; 
}) {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<SubUserFormValues>({
    resolver: zodResolver(subUserFormSchema),
    defaultValues: {
      role: 'employee',
      allowedCompanyIds: []
    }
  });

  const [isLoading, setIsLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);

  const onSubmit: SubmitHandler<SubUserFormValues> = async (data) => {
    try {
      setIsLoading(true);
      const newUser = await organizationApi.createSubUser({ ...data, orgId });
      toast.success('User created successfully');
      reset();
      onSuccess(newUser);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>Create a new user account for your organization.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input {...register('name')} placeholder="Jane Doe" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input {...register('email')} type="email" placeholder="jane@example.com" />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <div className="relative">
              <Input 
                {...register('password')} 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <select {...register('role')} className="w-full p-2 border rounded-md bg-background">
              <option value="admin">Admin (Full Access to Allotted Companies)</option>
              <option value="employee">Employee (Read/Add Only)</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Allotted Companies (Hold Ctrl/Cmd to select multiple)</Label>
            <select multiple {...register('allowedCompanyIds')} className="w-full p-2 border rounded-md bg-background h-32">
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create User'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
