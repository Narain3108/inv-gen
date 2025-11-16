/**
 * Client List Component
 * Display clients in a table with actions
 */

'use client';

import React, { useState } from 'react';
import { Client } from '@/types';
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

interface ClientListProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
  onView?: (client: Client) => void;
}

export function ClientList({ clients, onEdit, onDelete, onView }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.gstin?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      client.contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.contact.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.address.city.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  if (clients.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12">
        <Users className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Clients Yet</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Get started by adding your first client.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search clients by name, GSTIN, email, phone, city..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Clients Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Client Name</th>
                <th className="p-3 text-left text-sm font-medium">GSTIN</th>
                <th className="p-3 text-left text-sm font-medium">Contact</th>
                <th className="p-3 text-left text-sm font-medium">Location</th>
                <th className="p-3 text-left text-sm font-medium">State</th>
                <th className="p-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredClients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                  onClick={() => onView?.(client)}
                >
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{client.clientName}</p>
                      {client.pan && (
                        <p className="text-xs text-muted-foreground">PAN: {client.pan}</p>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    {client.gstin ? (
                      <span className="font-mono text-sm">{client.gstin}</span>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Unregistered
                      </Badge>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="text-sm">
                      <p>{client.contact.phone}</p>
                      <p className="text-xs text-muted-foreground">{client.contact.email}</p>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{client.address.city}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{client.address.state}</span>
                  </td>
                  <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(client)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(client)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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

      {/* No Results */}
      {filteredClients.length === 0 && clients.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No clients found matching your search criteria.
        </div>
      )}
    </div>
  );
}

export default ClientList;
