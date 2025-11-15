/**
 * Product List Component
 * Display products in a table with actions
 */

'use client';

import React, { useState } from 'react';
import { Product } from '@/types';
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
import { Edit, MoreVertical, Package, Search, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/utils/formatters';

interface ProductListProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
}

export function ProductList({ products, onEdit, onDelete }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.hsn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchesType = filterType === 'all' || product.type === filterType;

    return matchesSearch && matchesType;
  });

  if (products.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-12">
        <Package className="h-16 w-16 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No Products Yet</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Get started by creating your first product or service.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products, HSN codes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            size="sm"
          >
            All
          </Button>
          <Button
            variant={filterType === 'product' ? 'default' : 'outline'}
            onClick={() => setFilterType('product')}
            size="sm"
          >
            Products
          </Button>
          <Button
            variant={filterType === 'service' ? 'default' : 'outline'}
            onClick={() => setFilterType('service')}
            size="sm"
          >
            Services
          </Button>
        </div>
      </div>

      {/* Products Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-3 text-left text-sm font-medium">Name</th>
                <th className="p-3 text-left text-sm font-medium">Type</th>
                <th className="p-3 text-left text-sm font-medium">HSN/SAC</th>
                <th className="p-3 text-left text-sm font-medium">Unit</th>
                <th className="p-3 text-right text-sm font-medium">Price</th>
                <th className="p-3 text-center text-sm font-medium">GST</th>
                <th className="p-3 text-center text-sm font-medium">Stock</th>
                <th className="p-3 text-center text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <div>
                      <p className="font-medium">{product.productName}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant={product.type === 'product' ? 'default' : 'secondary'}>
                      {product.type === 'product' ? 'Product' : 'Service'}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-sm">{product.hsn}</span>
                  </td>
                  <td className="p-3">
                    <span className="text-sm">{product.unit}</span>
                  </td>
                  <td className="p-3 text-right font-medium">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="text-sm">{product.gstRate}%</span>
                  </td>
                  <td className="p-3 text-center">
                    {product.type === 'product' && typeof product.stock === 'number' ? (
                      <Badge 
                        variant={product.stock === 0 ? 'destructive' : product.stock < 10 ? 'secondary' : 'outline'}
                        className={product.stock < 10 && product.stock > 0 ? 'bg-orange-100 text-orange-800 border-orange-300' : ''}
                      >
                        {product.stock} {product.unit}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(product)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(product)}
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
      {filteredProducts.length === 0 && products.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No products found matching your search criteria.
        </div>
      )}
    </div>
  );
}

export default ProductList;
