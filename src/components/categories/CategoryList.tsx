/**
 * Product Category List Component
 * Displays and manages global product categories
 */

'use client';

import React, { useEffect, useState } from 'react';
import { ProductCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, Package } from 'lucide-react';
import { formatDate } from '@/utils/formatters';
import { usersApi } from '@/lib/api/users.api';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/components/ui/empty-state';

interface CategoryListProps {
  categories: ProductCategory[];
  onEdit: (category: ProductCategory) => void;
  onDelete: (category: ProductCategory) => void;
  loading?: boolean;
}

export function CategoryList({ categories, onEdit, onDelete, loading }: CategoryListProps) {
  const { user } = useAuth();
  const canViewCreators = user?.role === 'super_admin' || user?.role === 'admin';
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    const idsToFetch = new Set<string>();
    categories.forEach((c) => {
      if (canViewCreators && !c.createdByUsername && c.createdBy) idsToFetch.add(c.createdBy);
    });
    if (idsToFetch.size === 0) return;
    (async () => {
      for (const id of Array.from(idsToFetch)) {
        try {
          const u = await usersApi.getById(id);
          if (!mounted) return;
          setCreatorNames((s) => ({ ...s, [id]: u.username || u.name }));
        } catch (e) {
          // ignore
        }
      }
    })();
    return () => { mounted = false; };
  }, [categories, user]);
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center space-y-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <EmptyState
        title="No Product Categories"
        description="Create your first product category to organize products and auto-fill GST rates."
        icon={Package}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {categories.map((category) => (
        <Card key={category.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {category.categoryName}
                  <Badge variant="secondary" className="text-xs">
                    {category.defaultGstRate}% GST
                  </Badge>
                </CardTitle>
                {category.description && (
                  <CardDescription className="mt-1 text-xs line-clamp-2">
                    {category.description}
                  </CardDescription>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(category)}
                >
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={() => onDelete(category)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Package className="h-3.5 w-3.5" />
                <span>{category.products.length} product(s)</span>
              </div>

              {/* Show product list */}
              {category.products.length > 0 && (
                <div className="mt-3 space-y-1">
                  {category.products.slice(0, 3).map((product, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-muted/50 rounded px-2 py-1.5 flex items-center justify-between"
                    >
                      <span className="font-medium truncate flex-1">{product.name}</span>
                      <span className="text-muted-foreground ml-2">HSN: {product.hsn}</span>
                    </div>
                  ))}
                  {category.products.length > 3 && (
                    <p className="text-xs text-muted-foreground text-center pt-1">
                      +{category.products.length - 3} more
                    </p>
                  )}
                </div>
              )}

              {category.createdAt && (
                <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  Created {formatDate(category.createdAt)}
                  {canViewCreators && (
                    <span className="text-xs text-muted-foreground ml-2">by {category.createdByUsername || creatorNames[category.createdBy || ''] || 'Unknown'}</span>
                  )}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
