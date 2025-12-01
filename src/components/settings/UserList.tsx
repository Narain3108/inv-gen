'use client';

import React from 'react';
import { User } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, MoreVertical, Users } from 'lucide-react';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
}

export function UserList({ users, onEdit }: UserListProps) {
  if (users.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Users Yet</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Create your first user to get started.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Desktop View */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-4 text-left text-sm font-medium">Name</th>
                <th className="p-4 text-left text-sm font-medium">Email</th>
                <th className="p-4 text-left text-sm font-medium">Role</th>
                <th className="p-4 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-sm">{user.email}</td>
                  <td className="p-4">
                    <Badge variant={user.role === 'super_admin' ? 'default' : user.role === 'admin' ? 'secondary' : 'outline'}>
                      {user.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile View */}
      <div className="grid gap-4 md:hidden">
        {users.map((user) => (
          <Card key={user.id} className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground">{user.email}</div>
              <Badge variant={user.role === 'super_admin' ? 'default' : user.role === 'admin' ? 'secondary' : 'outline'} className="mt-1">
                {user.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}
      </div>
    </div>
  );
}
