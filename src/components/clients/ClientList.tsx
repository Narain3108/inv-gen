/**
 * Client List Component
 * Display clients in a table with actions
 */

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Client } from '@/types';
// Note: Modular utilities available for flat data structures
// import { SearchEngine, PaginationHandler } from '@/lib/modules/table-utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Edit, MoreVertical, Search, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usersApi } from '@/lib/api/users.api';

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView?: (client: Client) => void;
}

export function ClientList({ clients, onEdit, onDelete, onView }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const { user } = useAuth();
  const canViewCreators = user?.role === 'super_admin' || user?.role === 'admin';
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

  // Note: Using manual search for nested properties. 
  // For flat objects, SearchEngine and PaginationHandler from table-utils can be used directly.

  useEffect(() => {
    let mounted = true;
    const idsToFetch = new Set<string>();
    clients.forEach((c) => {
      if (canViewCreators && !c.createdByUsername && c.createdBy) idsToFetch.add(c.createdBy);
    });
    if (idsToFetch.size === 0) return;
    
    (async () => {
      try {
        const users = await usersApi.getBatch(Array.from(idsToFetch));
        if (!mounted) return;
        const newNames: Record<string, string> = {};
        users.forEach(u => {
          newNames[u.id] = u.username || u.name;
        });
        setCreatorNames(prev => ({ ...prev, ...newNames }));
      } catch (e) {
        console.error('Failed to fetch creator names', e);
      }
    })();
    
    return () => { mounted = false; };
  }, [clients, user]);

  // Use search engine for filtering
  const filteredClients = useMemo(() => {
    if (!searchTerm.trim()) {
      return clients;
    }
    
    // Manual search for nested properties since SearchEngine doesn't support dot notation
    const term = searchTerm.toLowerCase();
    return clients.filter(client => 
      client.clientName?.toLowerCase().includes(term) ||
      client.gstin?.toLowerCase().includes(term) ||
      client.contact?.email?.toLowerCase().includes(term) ||
      client.contact?.phone?.toLowerCase().includes(term) ||
      client.address?.city?.toLowerCase().includes(term) ||
      client.address?.state?.toLowerCase().includes(term)
    );
  }, [searchTerm, clients]);

  if (clients.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-primary/10 dark:border-primary/20 bg-gradient-to-br from-muted/30 to-transparent dark:from-muted/20\">
        <div className="p-4 sm:p-5 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 mb-4\">
          <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground\" />
        </div>
        <h3 className="mt-4 text-lg sm:text-xl font-bold text-foreground\">No Clients Yet</h3>
        <p className="mt-2 text-center text-sm sm:text-base text-muted-foreground max-w-sm\">
          Get started by adding your first client.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 h-10 sm:h-11 dark:border-primary/30 dark:focus:border-primary/50"
        />
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <Card className="hidden lg:block overflow-hidden border-2 border-primary/10 dark:border-primary/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50 dark:bg-muted/30">
              <tr>
                <th className="p-4 text-left text-sm font-semibold">Client Name</th>
                <th className="p-4 text-left text-sm font-semibold">GSTIN</th>
                <th className="p-4 text-left text-sm font-semibold">Contact</th>
                <th className="p-4 text-left text-sm font-semibold">Location</th>
                <th className="p-4 text-left text-sm font-semibold">State</th>
                <th className="p-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b last:border-0 hover:bg-muted/30 dark:hover:bg-muted/20 cursor-pointer transition-colors"
                  onClick={() => onView?.(client)}
                >
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-foreground">{client.clientName}</p>
                      {client.pan && (
                        <p className="text-xs text-muted-foreground mt-1">PAN: {client.pan}</p>
                      )}
                      {canViewCreators && (
                        <p className="text-xs text-muted-foreground mt-1">Created by: {client.createdByUsername || (client.createdBy ? creatorNames[client.createdBy] : undefined) || client.createdBy}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {client.gstin ? (
                      <span className="font-mono text-sm">{client.gstin}</span>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Unregistered
                      </Badge>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p className="font-medium">{client.contact.phone}</p>
                      <p className="text-xs text-muted-foreground mt-1">{client.contact.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{client.address.city}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{client.address.state}</span>
                  </td>
                  <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                    {user?.role !== 'employee' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="dark:hover:bg-muted/50">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="dark:bg-popover">
                        <DropdownMenuItem onClick={() => onEdit(client)} className="dark:hover:bg-muted/50">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(client)}
                          className="text-red-600 dark:text-red-400 dark:hover:bg-muted/50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Mobile Card View - Visible on mobile only */}
      <div className="lg:hidden space-y-3">
        {filteredClients.map((client) => (
          <Card 
            key={client.id}
            className="p-4 border-2 border-primary/10 dark:border-primary/20 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 hover-lift cursor-pointer bg-gradient-to-r from-muted/30 to-transparent dark:from-muted/20 hover:from-muted/50 dark:hover:from-muted/30"
            onClick={() => onView?.(client)}
          >
            <div className="space-y-3">
              {/* Header with name and actions */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base text-foreground truncate">{client.clientName}</h3>
                  {client.gstin ? (
                    <p className="font-mono text-xs text-muted-foreground mt-1">{client.gstin}</p>
                  ) : (
                    <Badge variant="secondary" className="text-xs mt-1">
                      Unregistered
                    </Badge>
                  )}
                </div>
                <div onClick={(e) => e.stopPropagation()}>
                  {user?.role !== 'employee' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 dark:hover:bg-muted/50">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="dark:bg-popover">
                      <DropdownMenuItem onClick={() => onEdit(client)} className="dark:hover:bg-muted/50">
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(client)}
                        className="text-red-600 dark:text-red-400 dark:hover:bg-muted/50"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}
                </div>
              </div>

              {/* Contact info */}
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium text-foreground">{client.contact.phone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-muted-foreground shrink-0">Email:</span>
                  <span className="font-medium text-foreground truncate">{client.contact.email}</span>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4 text-sm pt-2 border-t border-primary/10 dark:border-primary/20">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">City:</span>
                  <span className="font-medium text-foreground">{client.address.city}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">State:</span>
                  <span className="font-medium text-foreground">{client.address.state}</span>
                </div>
              </div>

              {client.pan && (
                <div className="text-xs text-muted-foreground">
                  <span>PAN: </span>
                  <span className="font-mono">{client.pan}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredClients.length === 0 && clients.length > 0 && (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <p className="text-sm sm:text-base">No clients found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}

export default ClientList;
