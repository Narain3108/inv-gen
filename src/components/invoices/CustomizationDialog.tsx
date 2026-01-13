import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Loader2, Settings, Save, RotateCcw } from 'lucide-react';
import { useCustomization } from '@/hooks/useCustomization';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import HeaderTab from '../customization/HeaderTab';
import FooterTab from '../customization/FooterTab';

import { Company } from '@/types';

interface CustomizationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  company?: Company; // Add company prop
  type: 'invoice' | 'quotation';
  onSave?: () => void;
}

export function CustomizationDialog({
  open,
  onOpenChange,
  companyId,
  company,
  type,
  onSave,
}: CustomizationDialogProps) {
  const {
    customization,
    loading,
    saving,
    updateCustomization,
    handleSave,
    handleReset,
  } = useCustomization({
    companyId,
    company, // Pass company to hook
    type,
    open,
    onSave,
    onClose: () => onOpenChange(false),
  });

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Customize Bill
          </DialogTitle>
          <DialogDescription>
            Configure the layout and content for your {type === 'invoice' ? 'invoice' : 'quotation'}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          <Tabs defaultValue="header" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="header">Header</TabsTrigger>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
            </TabsList>

            <TabsContent value="header" className="py-4">
              <HeaderTab
                customization={customization}
                type={type}
                onUpdate={updateCustomization}
              />
            </TabsContent>

            <TabsContent value="general" className="py-4 space-y-4">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <label
                    htmlFor="show-discount"
                    className="text-base font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Show Discount Column
                  </label>
                  <p className="text-sm text-muted-foreground">
                    Enable to display the discount column in the items table.
                  </p>
                </div>
                <Switch
                  id="show-discount"
                  checked={customization.table.showDiscount}
                  onCheckedChange={(checked) => updateCustomization('table.showDiscount', checked)}
                />
              </div>
            </TabsContent>

            <TabsContent value="footer" className="py-4">
              <FooterTab
                customization={customization}
                onUpdate={updateCustomization}
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-4">
          <Button variant="outline" onClick={handleReset} className="mr-auto">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
