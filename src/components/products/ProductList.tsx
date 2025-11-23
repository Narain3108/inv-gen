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
      <Card className="flex flex-col items-center justify-center p-8 sm:p-12 border-2 border-primary/10 dark:border-primary/20 bg-gradient-to-br from-muted/30 to-transparent dark:from-muted/20">
        <div className="p-4 sm:p-5 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 dark:from-primary/20 dark:to-accent/20 mb-4">
          <Package className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg sm:text-xl font-bold text-foreground">No Products Yet</h3>
        <p className="mt-2 text-center text-sm sm:text-base text-muted-foreground max-w-sm">
          Get started by creating your first product or service.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 sm:h-11 dark:border-primary/30 dark:focus:border-primary/50"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filterType === 'all' ? 'default' : 'outline'}
            onClick={() => setFilterType('all')}
            size="sm"
            className="flex-1 sm:flex-initial min-h-[40px] dark:border-primary/30"
          >
            All
          </Button>
          <Button
            variant={filterType === 'product' ? 'default' : 'outline'}
            onClick={() => setFilterType('product')}
            size="sm"
            className="flex-1 sm:flex-initial min-h-[40px] dark:border-primary/30"
          >
            Products
          </Button>
          <Button
            variant={filterType === 'service' ? 'default' : 'outline'}
            onClick={() => setFilterType('service')}
            size="sm"
            className="flex-1 sm:flex-initial min-h-[40px] dark:border-primary/30"
          >
            Services
          </Button>
        </div>
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <Card className="hidden lg:block overflow-hidden border-2 border-primary/10 dark:border-primary/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50 dark:bg-muted/30">
              <tr>
                <th className="p-4 text-left text-sm font-semibold">Name</th>
                <th className="p-4 text-left text-sm font-semibold">Item Code</th>
                <th className="p-4 text-left text-sm font-semibold">Type</th>
                <th className="p-4 text-left text-sm font-semibold">HSN/SAC</th>
                <th className="p-4 text-left text-sm font-semibold">Unit</th>
                <th className="p-4 text-right text-sm font-semibold">Price</th>
                <th className="p-4 text-center text-sm font-semibold">GST</th>
                <th className="p-4 text-center text-sm font-semibold">Stock</th>
                <th className="p-4 text-center text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id} className="border-b last:border-0 hover:bg-muted/30 dark:hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <div>
                      <p className="font-semibold text-foreground">{product.productName}</p>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {product.description}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    {product.itemCode ? (
                      <span className="font-mono text-sm font-medium bg-muted dark:bg-muted/50 px-2 py-1 rounded">
                        {product.itemCode}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant={product.type === 'product' ? 'default' : 'secondary'}>
                      {product.type === 'product' ? 'Product' : 'Service'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-sm">{product.hsn}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-sm">{product.unit}</span>
                  </td>
                  <td className="p-4 text-right font-semibold tabular-nums">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-sm font-medium">{product.gstRate}%</span>
                  </td>
                  <td className="p-4 text-center">
                    {product.type === 'product' && typeof product.stock === 'number' ? (
                      <Badge 
                        variant={product.stock === 0 ? 'destructive' : product.stock < 10 ? 'secondary' : 'outline'}
                        className={product.stock < 10 && product.stock > 0 ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-500/30' : ''}
                      >
                        {product.stock} {product.unit}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="dark:hover:bg-muted/50">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="dark:bg-popover">
                        <DropdownMenuItem onClick={() => onEdit(product)} className="dark:hover:bg-muted/50">
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(product)}
                          className="text-red-600 dark:text-red-400 dark:hover:bg-muted/50"
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

      {/* Mobile Card View - Visible on mobile only */}
      <div className="lg:hidden space-y-3">
        {filteredProducts.map((product) => (
          <Card 
            key={product.id}
            className="p-4 border-2 border-primary/10 dark:border-primary/20 hover:border-primary/30 dark:hover:border-primary/40 transition-all duration-300 hover-lift bg-gradient-to-r from-muted/30 to-transparent dark:from-muted/20 hover:from-muted/50 dark:hover:from-muted/30"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-base text-foreground truncate">{product.productName}</h3>
                    <Badge variant={product.type === 'product' ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {product.type === 'product' ? 'Product' : 'Service'}
                    </Badge>
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 dark:hover:bg-muted/50">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="dark:bg-popover">
                    <DropdownMenuItem onClick={() => onEdit(product)} className="dark:hover:bg-muted/50">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(product)}
                      className="text-red-600 dark:text-red-400 dark:hover:bg-muted/50"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm pt-2 border-t border-primary/10 dark:border-primary/20">
                {product.itemCode && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Item Code</span>
                    <span className="font-mono text-xs font-medium bg-muted dark:bg-muted/50 px-2 py-1 rounded inline-block">
                      {product.itemCode}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground block mb-1">HSN/SAC</span>
                  <span className="font-mono text-xs font-medium">{product.hsn}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Price</span>
                  <span className="font-bold text-foreground tabular-nums">{formatCurrency(product.price)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">GST Rate</span>
                  <span className="font-medium text-foreground">{product.gstRate}%</span>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Unit</span>
                  <span className="font-medium text-foreground">{product.unit}</span>
                </div>
                {product.type === 'product' && typeof product.stock === 'number' && (
                  <div>
                    <span className="text-muted-foreground block mb-1">Stock</span>
                    <Badge 
                      variant={product.stock === 0 ? 'destructive' : product.stock < 10 ? 'secondary' : 'outline'}
                      className={`text-xs ${product.stock < 10 && product.stock > 0 ? 'bg-orange-100 dark:bg-orange-500/10 text-orange-800 dark:text-orange-400 border-orange-300 dark:border-orange-500/30' : ''}`}
                    >
                      {product.stock} {product.unit}
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* No Results */}
      {filteredProducts.length === 0 && products.length > 0 && (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <p className="text-sm sm:text-base">No products found matching your search criteria.</p>
        </div>
      )}
    </div>
  );
}

export default ProductList;
