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
import { Edit, MoreVertical, Users, TrendingUp } from 'lucide-react';
import { ROLES } from '@/lib/constants';
import { EmptyState } from '@/components/ui/empty-state';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onAnalysis: (user: User) => void;
}

export function UserList({ users, onEdit, onAnalysis }: UserListProps) {
  if (users.length === 0) {
    return (
      <EmptyState
        title="No Users Yet"
        description="Create your first user to get started."
        icon={Users}
      />
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
                    <Badge variant={user.role === ROLES.SUPER_ADMIN ? 'default' : user.role === ROLES.ADMIN ? 'secondary' : 'outline'}>
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
                        <DropdownMenuItem onClick={() => onAnalysis(user)}>
                          <TrendingUp className="mr-2 h-4 w-4" />
                          Analysis
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
          <Card key={user.id} className="p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <div className="font-semibold text-base">{user.name}</div>
                <div className="text-sm text-muted-foreground break-all">{user.email}</div>
              </div>
              <Badge variant={user.role === ROLES.SUPER_ADMIN ? 'default' : user.role === ROLES.ADMIN ? 'secondary' : 'outline'}>
                {user.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            {user.allowedCompanyIds?.length ? (
              <div className="text-xs text-muted-foreground">
                Access to {user.allowedCompanyIds.length} compan{user.allowedCompanyIds.length === 1 ? 'y' : 'ies'}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">All companies</div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-full">
                  <MoreVertical className="h-4 w-4" />
                  <span className="ml-2">Manage</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(user)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAnalysis(user)}>
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analysis
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}
      </div>
    </div>
  );
}
