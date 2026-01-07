/**
 * Invoice Customization Dialog
 * Allows users to customize invoice layout and format
 * Refactored to use separate tab components and useCustomization hook
 */

'use client';

import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, Save, RotateCcw } from 'lucide-react';
import { useCustomization } from '@/hooks/useCustomization';
import {
  HeaderTab,
  AddressesTab,
  ColumnsTab,
  TotalsTab,
  FooterTab,
  LayoutTab,
} from '@/components/customization';

interface CustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  type: 'invoice' | 'quotation';
  onSave?: () => void;
}

export function CustomizationDialog({
  open,
  onOpenChange,
  companyId,
  type,
  onSave,
}: CustomizationDialogProps) {
  const {
    customization,
    loading,
    saving,
    updateCustomization,
    handleColumnToggle,
    handleColumnReorder,
    handleSave,
    handleReset,
  } = useCustomization({
    companyId,
    type,
    open,
    onSave,
    onClose: () => onOpenChange(false),
  });

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Customize {type === 'invoice' ? 'Invoice' : 'Quotation'}
          </DialogTitle>
          <DialogDescription>
            Customize the layout and format of your {type === 'invoice' ? 'invoices' : 'quotations'}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="header" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="header">Header</TabsTrigger>
            <TabsTrigger value="addresses">Addresses</TabsTrigger>
            <TabsTrigger value="columns">Columns</TabsTrigger>
            <TabsTrigger value="totals">Totals</TabsTrigger>
            <TabsTrigger value="footer">Footer</TabsTrigger>
            <TabsTrigger value="layout">Layout</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-4 pr-2">
            <TabsContent value="header" className="mt-0">
              <HeaderTab
                customization={customization}
                type={type}
                onUpdate={updateCustomization}
              />
            </TabsContent>

            <TabsContent value="addresses" className="mt-0">
              <AddressesTab
                customization={customization}
                onUpdate={updateCustomization}
              />
            </TabsContent>

            <TabsContent value="columns" className="mt-0">
              <ColumnsTab
                customization={customization}
                onUpdate={updateCustomization}
                onColumnToggle={handleColumnToggle}
                onColumnReorder={handleColumnReorder}
              />
            </TabsContent>

            <TabsContent value="totals" className="mt-0">
              <TotalsTab
                customization={customization}
                onUpdate={updateCustomization}
              />
            </TabsContent>

            <TabsContent value="footer" className="mt-0">
              <FooterTab
                customization={customization}
                onUpdate={updateCustomization}
              />
            </TabsContent>

            <TabsContent value="layout" className="mt-0">
              <LayoutTab
                customization={customization}
                onUpdate={updateCustomization}
              />
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save Customization
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
