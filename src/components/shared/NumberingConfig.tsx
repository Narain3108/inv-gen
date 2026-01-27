'use client';

import React, { useState, useEffect } from 'react';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GripVertical, Hash } from 'lucide-react';

interface NumberingConfigProps {
  title: string;
  description: string;
  prefix: string;
  suffix: string;
  order: string;
  nextNumber?: number;
  onPrefixChange: (value: string) => void;
  onSuffixChange: (value: string) => void;
  onOrderChange: (value: string) => void;
}

type OrderComponent = 'prefix' | 'number' | 'suffix';

export function NumberingConfig({
  title,
  description,
  prefix,
  suffix,
  order,
  nextNumber = 1,
  onPrefixChange,
  onSuffixChange,
  onOrderChange,
}: NumberingConfigProps) {
  const [components, setComponents] = useState<OrderComponent[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const parts = order.split(',').map(p => p.trim()) as OrderComponent[];
    const validParts = parts.filter(p => ['prefix', 'number', 'suffix'].includes(p));
    setComponents(validParts.length > 0 ? validParts : ['prefix', 'number', 'suffix']);
  }, [order]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newComponents = [...components];
    const draggedItem = newComponents[draggedIndex];
    newComponents.splice(draggedIndex, 1);
    newComponents.splice(index, 0, draggedItem);

    setComponents(newComponents);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    onOrderChange(components.join(','));
  };

  const getComponentLabel = (component: OrderComponent) => {
    switch (component) {
      case 'prefix':
        return prefix || 'PREFIX';
      case 'number':
        return String(nextNumber).padStart(3, '0');
      case 'suffix':
        return suffix || 'SUFFIX';
    }
  };

  const getComponentColor = (component: OrderComponent) => {
    switch (component) {
      case 'prefix':
        return 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600';
      case 'number':
        return 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600';
      case 'suffix':
        return 'bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600';
    }
  };

  const previewNumber = components
    .map(c => {
      if (c === 'prefix' && prefix) return prefix;
      if (c === 'number') return String(nextNumber).padStart(3, '0');
      if (c === 'suffix' && suffix) return suffix;
      return '';
    })
    .filter(Boolean)
    .join('');

  const defaultPreview = components.length === 0
    ? `INV${String(nextNumber).padStart(4, '0')}`
    : previewNumber || `INV${String(nextNumber).padStart(4, '0')}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg sm:text-xl">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FloatingLabelInput
              id={`${title}-prefix`}
              label="Prefix (Optional)"
              value={prefix}
              onChange={(e) => onPrefixChange(e.target.value)}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground mt-1">Text before the number</p>
          </div>

          <div>
            <FloatingLabelInput
              id={`${title}-suffix`}
              label="Suffix (Optional)"
              value={suffix}
              onChange={(e) => onSuffixChange(e.target.value)}
              className="uppercase"
            />
            <p className="text-xs text-muted-foreground mt-1">Text after the number</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Component Order</Label>
            <span className="text-xs text-muted-foreground">Drag to reorder</span>
          </div>

          <div className="flex flex-wrap gap-2 p-4 bg-muted/30 dark:bg-muted/10 rounded-lg border-2 border-dashed border-muted-foreground/20">
            {components.map((component, index) => (
              <div
                key={`${component}-${index}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-2 px-3 py-2 rounded-md border-2 cursor-move transition-all hover:scale-105 ${getComponentColor(component)} ${draggedIndex === index ? 'opacity-50 scale-95' : ''
                  }`}
              >
                <GripVertical className="h-4 w-4 opacity-50" />
                {component === 'number' && <Hash className="h-4 w-4" />}
                <span className="font-mono font-semibold text-sm">
                  {getComponentLabel(component)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Preview</Label>
          <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 rounded-lg border border-primary/20 dark:border-primary/30">
            <div className="flex-1">
              <p className="text-xs text-muted-foreground mb-1">Next number will be:</p>
              <p className="font-mono font-bold text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {defaultPreview}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {prefix || suffix
              ? 'Auto-generated based on your configuration'
              : 'Default format will be used if no prefix/suffix is provided'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
