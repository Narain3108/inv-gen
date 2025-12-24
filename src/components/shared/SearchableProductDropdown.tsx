/**
 * Searchable Product Dropdown Component
 * A reusable dropdown with search functionality and "Add Product" option
 */

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductForm } from '@/components/products/ProductForm';
import { productsApi } from '@/lib/api/products.api';
import { toast } from 'sonner';
import { z } from 'zod';
import { productFormSchema } from '@/lib/validations';
import { useAppData } from '@/contexts/AppDataContext';

type ProductFormData = z.infer<typeof productFormSchema>;

interface SearchableProductDropdownProps {
  products: Product[];
  selectedProductName?: string;
  onProductSelect: (productName: string, product?: Product) => void;
  onProductAdded?: (product: Product) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  companyId: string;
  className?: string;
}

export function SearchableProductDropdown({
  products,
  selectedProductName,
  onProductSelect,
  onProductAdded,
  placeholder = "Search or select product...",
  label = "Product",
  required = false,
  error,
  companyId,
  className
}: SearchableProductDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refreshProducts } = useAppData();

  const selectedProduct = products.find(p => p.productName === selectedProductName);

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.hsn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => 
            prev < filteredProducts.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
            handleProductSelect(filteredProducts[highlightedIndex]);
          } else if (filteredProducts.length === 0 && searchTerm.trim()) {
            setIsAddProductOpen(true);
            setIsOpen(false);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSearchTerm('');
          setHighlightedIndex(-1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, highlightedIndex, filteredProducts, searchTerm]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProductSelect = (product: Product) => {
    onProductSelect(product.productName, product);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleAddProduct = async (data: ProductFormData) => {
    try {
      const productData = {
        ...data,
        description: data.description ?? undefined,
        itemCode: data.itemCode ?? undefined,
        cessRate: data.cessRate ?? undefined,
        stock: data.stock ?? undefined,
        hasSerialNumber: data.hasSerialNumber ?? undefined,
        companyId,
      };
      const newProduct = await productsApi.create(productData);
      
      toast.success('Product added successfully');
      // Refresh the global products list
      await refreshProducts();
      onProductAdded?.(newProduct);
      onProductSelect(newProduct.productName, newProduct);
      setIsAddProductOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product');
      throw error;
    }
  };

  const displayValue = selectedProduct 
    ? selectedProduct.productName
    : selectedProductName || '';

  return (
    <div className={cn("space-y-2", className)} ref={dropdownRef}>
      {label && (
        <Label htmlFor="product-search">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}
      
      <div className="relative">
        <div
          className={cn(
            "flex h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer",
            "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
            error && "border-red-500"
          )}
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
        >
          <Input
            ref={inputRef}
            id="product-search"
            value={isOpen ? searchTerm : displayValue}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setHighlightedIndex(-1);
              if (!isOpen) setIsOpen(true);
              // Allow typing custom product names
              if (!isOpen) {
                onProductSelect(e.target.value);
              }
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />
          <ChevronDown className={cn(
            "h-4 w-4 opacity-50 transition-transform",
            isOpen && "rotate-180"
          )} />
        </div>

        {isOpen && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto">
            <CardContent className="p-0">
              {filteredProducts.length > 0 ? (
                <div className="py-1">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.id || `product-${index}-${product.productName}`}
                      className={cn(
                        "px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground",
                        index === highlightedIndex && "bg-accent text-accent-foreground",
                        selectedProductName === product.productName && "bg-primary/10"
                      )}
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium">{product.productName}</div>
                          <div className="text-xs text-muted-foreground">
                            {product.hsn} • ₹{product.price} • {product.unit}
                            {product.itemCode && ` • ${product.itemCode}`}
                          </div>
                        </div>
                        {selectedProductName === product.productName && (
                          <Check className="h-4 w-4 text-primary" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-sm text-muted-foreground text-center">
                  No products found
                </div>
              )}
              
              {/* Add Product Button */}
              <div className="border-t p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 transition-all duration-200 font-semibold"
                  onClick={() => {
                    setIsAddProductOpen(true);
                    setIsOpen(false);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Product
                  {searchTerm.trim() && ` "${searchTerm.trim()}"`}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {/* Add Product Dialog */}
      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product to add to your catalog.
              {searchTerm.trim() && ` The product name will be pre-filled with "${searchTerm.trim()}".`}
            </DialogDescription>
          </DialogHeader>
          <ProductForm
            companyId={companyId}
            onSubmit={handleAddProduct}
            onCancel={() => setIsAddProductOpen(false)}
            product={searchTerm.trim() ? { 
              productName: searchTerm.trim(),
              type: 'product',
              unit: 'Nos',
              price: 0,
              gstRate: 18,
              cessRate: 0,
              hasSerialNumber: false
            } as any : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}