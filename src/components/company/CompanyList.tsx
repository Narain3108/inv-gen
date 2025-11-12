/**
 * Company List Component
 * Display and manage companies
 */

'use client';

import React from 'react';
import { Company } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Edit, Trash2, Check } from 'lucide-react';
import { formatGSTIN } from '@/utils/formatters';
import Image from 'next/image';

interface CompanyListProps {
  companies: Company[];
  selectedCompanyId?: string;
  onSelect: (company: Company) => void;
  onEdit: (company: Company) => void;
  onDelete: (companyId: string) => void;
}

export function CompanyList({
  companies,
  selectedCompanyId,
  onSelect,
  onEdit,
  onDelete,
}: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No companies yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first company profile.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => (
        <Card
          key={company.id}
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedCompanyId === company.id ? 'ring-2 ring-primary' : ''
          }`}
          onClick={() => onSelect(company)}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {company.logoUrl ? (
                  <div className="relative h-12 w-12 rounded-lg border">
                    <Image
                      src={company.logoUrl}
                      alt={company.name}
                      fill
                      className="rounded-lg object-contain p-1"
                    />
                  </div>
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{company.name}</h3>
                    {selectedCompanyId === company.id && (
                      <Badge variant="default" className="h-5">
                        <Check className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {company.gstin ? formatGSTIN(company.gstin) : 'No GSTIN'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-1 text-sm text-muted-foreground">
              <p>{company.address.city}, {company.address.state}</p>
              <p>{company.contact.email}</p>
              <p>{company.contact.phone}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(company);
                }}
              >
                <Edit className="mr-1 h-3 w-3" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(company.id);
                }}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
