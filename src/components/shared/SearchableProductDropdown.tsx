'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Product } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Check, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/utils/formatters';
import { ProductForm } from '@/components/products/ProductForm';
import { productsApi } from '@/lib/api/products.api';
import { toast } from 'sonner';
import { z } from 'zod';
import { productFormSchema } from '@/lib/validations';
import { useAppData } from '@/contexts/AppDataContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

type ProductFormData = z.infer<typeof productFormSchema>;

interface SearchableProductDropdownProps {
  products: Product[];
  selectedProductId?: string;
  onProductSelect: (productId: string, product?: Product) => void;
  onProductAdded?: (product: Product) => void;
  // Note: some consumers pass onProductAdded, some might not. 
  // PurchaseForm uses onProductSelect(id) but might need full product. 
  // Let's keep signature compabitible.
  onProductCreate?: () => void; // Legacy prop, can maps to add dialog
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  companyId?: string; // Optional if not creating
  className?: string;
}

export function SearchableProductDropdown({
  products,
  selectedProductId,
  onProductSelect,
  onProductAdded,
  onProductCreate,
  placeholder = " ",
  label = "Product/Service",
  required = false,
  error,
  companyId = "",
  className
}: SearchableProductDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { refreshProducts } = useAppData();

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const filteredProducts = products.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.itemCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex(prev => prev < filteredProducts.length - 1 ? prev + 1 : prev);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
            handleProductSelect(filteredProducts[highlightedIndex]);
          } else if (searchTerm.trim() && filteredProducts.length === 0) {
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
    onProductSelect(product.id, product);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleAddProduct = async (data: ProductFormData) => {
    try {
      if (!companyId) {
        toast.error("Company ID missing");
        return;
      }
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
      await refreshProducts();
      onProductAdded?.(newProduct);
      handleProductSelect(newProduct);
      setIsAddProductOpen(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Failed to add product:', error);
      toast.error('Failed to add product');
    }
  };

  const displayValue = selectedProduct ? selectedProduct.productName : '';

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative">
        <div
          className={cn(
            "group relative flex w-full rounded-md border-2 border-foreground/40 bg-transparent text-xs ring-offset-background cursor-pointer transition-colors duration-200",
            "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
            error && "border-destructive focus-within:border-destructive focus-within:ring-destructive/20",
            "pt-3 pb-1.5 px-2.5"
          )}
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
        >
          <input
            ref={inputRef}
            value={isOpen ? searchTerm : displayValue}
            onChange={(e) => {
              const v = e.target.value;
              setSearchTerm(v);
              setHighlightedIndex(-1);
              if (v && v.trim() !== '') setIsOpen(true);
            }}
            onFocus={() => {
              // don't auto open
            }}
            placeholder=" "
            className="peer block w-full appearance-none bg-transparent p-0 text-xs focus:outline-none focus:ring-0 placeholder-transparent"
            autoComplete="off"
          />

          <ChevronDown className={cn(
            "h-4 w-4 opacity-50 transition-transform absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none",
            isOpen && "rotate-180"
          )} />

          <label
            className={cn(
              "absolute left-2.5 top-1/2 -translate-y-1/2 origin-[0] select-none bg-transparent px-0.5 text-xs text-muted-foreground pointer-events-none transition-all duration-200 ease-out",
              (isOpen || searchTerm || displayValue) && "top-0 -translate-y-1/2 scale-[0.85] px-1 text-primary bg-background",
              "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:scale-[0.85] peer-focus:px-1 peer-focus:text-primary peer-focus:bg-background",
              "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 peer-[:not(:placeholder-shown)]:scale-[0.85] peer-[:not(:placeholder-shown)]:px-1 peer-[:not(:placeholder-shown)]:bg-background",
              error && "text-destructive peer-focus:text-destructive"
            )}
          >
            {label} {required && <span>*</span>}
          </label>
        </div>

        {isOpen && (
          <Card className="absolute z-50 w-full mt-1 max-h-60 overflow-auto shadow-lg">
            <CardContent className="p-0">
              {filteredProducts.length > 0 ? (
                <div className="py-1">
                  {filteredProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={cn(
                        "px-3 py-2 cursor-pointer text-sm hover:bg-accent hover:text-accent-foreground",
                        index === highlightedIndex && "bg-accent text-accent-foreground",
                        selectedProductId === product.id && "bg-primary/10"
                      )}
                      onClick={() => handleProductSelect(product)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{product.productName}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {product.description || `Stock: ${product.stock}`}
                          </p>
                        </div>
                        {selectedProductId === product.id ? (
                          <Check className="h-4 w-4 text-primary" />
                        ) : (
                          <span className="text-xs font-mono text-muted-foreground ml-2">
                            {formatCurrency(product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 text-sm text-center">
                  <p className="text-muted-foreground mb-2">No products found</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsAddProductOpen(true);
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Create "{searchTerm}"
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive mt-1">{error}</p>
      )}

      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
            <DialogDescription>
              Create a new product to add to your catalog.
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