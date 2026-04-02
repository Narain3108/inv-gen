'use client';

import React, { useState } from 'react';
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
import { Edit, MoreVertical, Users, TrendingUp, Trash2, Loader2 } from 'lucide-react';
import { ROLES } from '@/lib/constants';
import { EmptyState } from '@/components/ui/empty-state';

interface UserListProps {
  users: User[];
  onEdit: (user: User) => void;
  onAnalysis: (user: User) => void;
  onDelete?: (userIds: string[]) => void;
  isDeleting?: boolean;
}

export function UserList({ users, onEdit, onAnalysis, onDelete, isDeleting = false }: UserListProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(users.map(u => u.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelect = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };
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
      {selectedIds.length > 0 && onDelete && (
        <div className="flex justify-start">
          <Button 
            variant="destructive" 
            onClick={() => onDelete(selectedIds)}
            disabled={isDeleting}
            size="sm"
          >
            {isDeleting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Trash2 className="mr-2 h-4 w-4" />
            )}
            Delete Selected ({selectedIds.length})
          </Button>
        </div>
      )}

      {/* Desktop View */}
      <Card className="hidden md:block overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                {onDelete && (
                  <th className="p-4 w-12 text-center text-left">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-background cursor-pointer"
                      checked={users.length > 0 && selectedIds.length === users.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                  </th>
                )}
                <th className="p-4 text-left text-sm font-medium">Name</th>
                <th className="p-4 text-left text-sm font-medium">Email</th>
                <th className="p-4 text-left text-sm font-medium">Role</th>
                <th className="p-4 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr 
                  key={user.id} 
                  className={`border-b last:border-0 hover:bg-muted/30 ${selectedIds.includes(user.id) ? 'bg-muted/50' : ''}`}
                >
                  {onDelete && (
                    <td className="p-4 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-background cursor-pointer"
                        checked={selectedIds.includes(user.id)}
                        onChange={(e) => handleSelect(user.id, e.target.checked)}
                      />
                    </td>
                  )}
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
                        {onDelete && (
                          <DropdownMenuItem 
                            onClick={() => onDelete([user.id])}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
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
          <Card 
            key={user.id} 
            className={`p-4 space-y-3 ${selectedIds.includes(user.id) ? 'bg-muted/30 border-primary/50' : ''}`}
          >
            <div className="flex justify-between items-start mb-1">
              <div className="flex items-center gap-2">
                {onDelete && (
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 bg-background cursor-pointer"
                      checked={selectedIds.includes(user.id)}
                      onChange={(e) => handleSelect(user.id, e.target.checked)}
                    />
                  </div>
                )}
                <div className="font-semibold text-base">{user.name}</div>
              </div>
              <Badge variant={user.role === ROLES.SUPER_ADMIN ? 'default' : user.role === ROLES.ADMIN ? 'secondary' : 'outline'}>
                {user.role.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            <div className="flex flex-col gap-1 pl-6">
              <div className="text-sm text-muted-foreground break-all">{user.email}</div>
            </div>
            {user.allowedCompanyIds?.length ? (
              <div className="text-xs text-muted-foreground pl-6">
                Access to {user.allowedCompanyIds.length} compan{user.allowedCompanyIds.length === 1 ? 'y' : 'ies'}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground pl-6">All companies</div>
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
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={() => onDelete([user.id])}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </Card>
        ))}
      </div>
    </div>
  );
}
