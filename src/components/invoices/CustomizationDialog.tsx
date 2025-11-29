/**
 * Invoice Customization Dialog
 * Allows users to customize invoice layout and format
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Settings, Eye, Save, RotateCcw, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
import { InvoiceCustomization, InvoiceColumn, DEFAULT_INVOICE_CUSTOMIZATION, DEFAULT_QUOTATION_CUSTOMIZATION } from '@/types/customization';
import { customizationsApi } from '@/lib/api/customizations.api';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

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
  const [customization, setCustomization] = useState<InvoiceCustomization>({
    ...(type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION),
    companyId,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load existing customization
  useEffect(() => {
    if (open && companyId) {
      loadCustomization();
    }
  }, [open, companyId, type]);

  const loadCustomization = async () => {
    setLoading(true);
    try {
      const data = await customizationsApi.getByCompanyId(companyId, type);
      
      if (data && data.id !== 'default') {
        // Merge with defaults to ensure all fields exist
        const defaults = type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION;
        setCustomization({
          ...defaults,
          ...data,
          header: { ...defaults.header, ...(data.header || {}) },
          companyDetails: { ...defaults.companyDetails, ...(data.companyDetails || {}) },
          addresses: { ...defaults.addresses, ...(data.addresses || {}) },
          table: { ...defaults.table, ...(data.table || {}) },
          totals: { ...defaults.totals, ...(data.totals || {}) },
          footer: { ...defaults.footer, ...(data.footer || {}) },
          colorScheme: { ...defaults.colorScheme, ...(data.colorScheme || {}) },
          margins: { ...defaults.margins, ...(data.margins || {}) },
          companyId,
          type,
        } as InvoiceCustomization);
      } else {
        // Use defaults
        setCustomization({
          ...(type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION),
          companyId,
          type, // Ensure type is set
        });
      }
    } catch (error) {
      console.error('Error loading customization:', error);
      toast.error('Failed to load customization settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await customizationsApi.createOrUpdate(companyId, {
        ...customization,
        companyId,
        type,
      });
      
      toast.success(`${type === 'invoice' ? 'Invoice' : 'Quotation'} customization saved successfully`);
      onSave?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving customization:', error);
      toast.error('Failed to save customization');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCustomization({
      ...(type === 'invoice' ? DEFAULT_INVOICE_CUSTOMIZATION : DEFAULT_QUOTATION_CUSTOMIZATION),
      companyId,
    });
    toast.success('Reset to default settings');
  };

  const updateCustomization = (path: string, value: any) => {
    setCustomization(prev => {
      const keys = path.split('.');
      const newCustomization = { ...prev };
      let current: any = newCustomization;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newCustomization;
    });
  };

  const handleColumnToggle = (columnId: string, enabled: boolean) => {
    const updatedColumns = customization.table.columns.map(col =>
      col.id === columnId ? { ...col, enabled } : col
    );
    updateCustomization('table.columns', updatedColumns);
  };

  const handleColumnReorder = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(customization.table.columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedColumns = items.map((col, index) => ({ ...col, order: index }));
    updateCustomization('table.columns', reorderedColumns);
  };

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
            {/* Header Tab */}
            <TabsContent value="header" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Header Settings</CardTitle>
                  <CardDescription>Customize the invoice header and title</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Document Title</Label>
                    <Input
                      id="title"
                      value={customization.header.title}
                      onChange={(e) => updateCustomization('header.title', e.target.value)}
                      placeholder="TAX INVOICE"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fontSize">Title Size</Label>
                    <Select
                      value={customization.header.fontSize}
                      onValueChange={(value) => updateCustomization('header.fontSize', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="invoiceNumberLabel">Invoice Number Label</Label>
                      <Input
                        id="invoiceNumberLabel"
                        value={customization.header.invoiceNumberLabel}
                        onChange={(e) => updateCustomization('header.invoiceNumberLabel', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-8">
                      <Label>Show Invoice Number</Label>
                      <Switch
                        checked={customization.header.showInvoiceNumber}
                        onCheckedChange={(checked) => updateCustomization('header.showInvoiceNumber', checked)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateLabel">Date Label</Label>
                      <Input
                        id="dateLabel"
                        value={customization.header.dateLabel}
                        onChange={(e) => updateCustomization('header.dateLabel', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-8">
                      <Label>Show Date</Label>
                      <Switch
                        checked={customization.header.showDate}
                        onCheckedChange={(checked) => updateCustomization('header.showDate', checked)}
                      />
                    </div>
                  </div>

                  {type === 'quotation' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dueDateLabel">Valid Until Label</Label>
                        <Input
                          id="dueDateLabel"
                          value={customization.header.dueDateLabel}
                          onChange={(e) => updateCustomization('header.dueDateLabel', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center justify-between pt-8">
                        <Label>Show Valid Until</Label>
                        <Switch
                          checked={customization.header.showDueDate}
                          onCheckedChange={(checked) => updateCustomization('header.showDueDate', checked)}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Company Details</CardTitle>
                  <CardDescription>Choose what company information to display</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries({
                    showLogo: 'Show Logo',
                    showName: 'Show Company Name',
                    showAddress: 'Show Address',
                    showGSTIN: 'Show GSTIN',
                    showPhone: 'Show Phone',
                    showEmail: 'Show Email',
                    showPAN: 'Show PAN',
                    showBankDetails: 'Show Bank Details',
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label>{label}</Label>
                      <Switch
                        checked={customization.companyDetails[key as keyof typeof customization.companyDetails]}
                        onCheckedChange={(checked) => updateCustomization(`companyDetails.${key}`, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Address Settings</CardTitle>
                  <CardDescription>Customize how addresses are displayed</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="billingLabel">Billing Address Label</Label>
                      <Input
                        id="billingLabel"
                        value={customization.addresses.billingLabel}
                        onChange={(e) => updateCustomization('addresses.billingLabel', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-8">
                      <Label>Show Billing Address</Label>
                      <Switch
                        checked={customization.addresses.showBillingAddress}
                        onCheckedChange={(checked) => updateCustomization('addresses.showBillingAddress', checked)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingLabel">Shipping Address Label</Label>
                      <Input
                        id="shippingLabel"
                        value={customization.addresses.shippingLabel}
                        onChange={(e) => updateCustomization('addresses.shippingLabel', e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-8">
                      <Label>Show Shipping Address</Label>
                      <Switch
                        checked={customization.addresses.showShippingAddress}
                        onCheckedChange={(checked) => updateCustomization('addresses.showShippingAddress', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <Label className="text-base font-semibold">Address Details</Label>
                    <div className="flex items-center justify-between">
                      <Label>Show GSTIN</Label>
                      <Switch
                        checked={customization.addresses.showGSTIN}
                        onCheckedChange={(checked) => updateCustomization('addresses.showGSTIN', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Phone</Label>
                      <Switch
                        checked={customization.addresses.showPhone}
                        onCheckedChange={(checked) => updateCustomization('addresses.showPhone', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Show Email</Label>
                      <Switch
                        checked={customization.addresses.showEmail}
                        onCheckedChange={(checked) => updateCustomization('addresses.showEmail', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Columns Tab */}
            <TabsContent value="columns" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Table Columns</CardTitle>
                  <CardDescription>
                    Enable/disable columns and drag to reorder
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <DragDropContext onDragEnd={handleColumnReorder}>
                    <Droppable droppableId="columns">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2"
                        >
                          {customization.table.columns
                            .sort((a, b) => a.order - b.order)
                            .map((column, index) => (
                              <Draggable
                                key={column.id}
                                draggableId={column.id}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <div {...provided.dragHandleProps}>
                                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                                      </div>
                                      <Label className="cursor-pointer">
                                        {column.label}
                                      </Label>
                                    </div>
                                    <Switch
                                      checked={column.enabled}
                                      onCheckedChange={(checked) =>
                                        handleColumnToggle(column.id, checked)
                                      }
                                    />
                                  </div>
                                )}
                              </Draggable>
                            ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>

                  <div className="mt-6 pt-6 border-t space-y-3">
                    <Label className="text-base font-semibold">Additional Options</Label>
                    <div className="flex items-center justify-between">
                      <Label>Show Serial Numbers</Label>
                      <Switch
                        checked={customization.table.showSerialNumbers}
                        onCheckedChange={(checked) => updateCustomization('table.showSerialNumbers', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Totals Tab */}
            <TabsContent value="totals" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Totals Section</CardTitle>
                  <CardDescription>Choose what to display in the totals section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries({
                    showTaxableAmount: 'Show Taxable Amount',
                    showGSTBreakdown: 'Show GST Breakdown by Rate',
                    showCGST: 'Show CGST',
                    showSGST: 'Show SGST',
                    showIGST: 'Show IGST',
                    showCess: 'Show Cess',
                    showDiscount: 'Show Total Discount',
                    showRoundOff: 'Show Round Off',
                    showAmountInWords: 'Show Amount in Words',
                  }).map(([key, label]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label>{label}</Label>
                      <Switch
                        checked={customization.totals[key as keyof typeof customization.totals]}
                        onCheckedChange={(checked) => updateCustomization(`totals.${key}`, checked)}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Footer Tab */}
            <TabsContent value="footer" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Footer Settings</CardTitle>
                  <CardDescription>Customize the footer section</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Show Terms and Conditions</Label>
                    <Switch
                      checked={customization.footer.showTermsAndConditions}
                      onCheckedChange={(checked) => updateCustomization('footer.showTermsAndConditions', checked)}
                    />
                  </div>

                  {customization.footer.showTermsAndConditions && (
                    <div className="space-y-2">
                      <Label htmlFor="termsText">Terms and Conditions</Label>
                      <Textarea
                        id="termsText"
                        value={customization.footer.termsText}
                        onChange={(e) => updateCustomization('footer.termsText', e.target.value)}
                        rows={4}
                        placeholder="Enter your terms and conditions..."
                      />
                    </div>
                  )}

              

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Label>Show Signature</Label>
                    <Switch
                      checked={customization.footer.showSignature}
                      onCheckedChange={(checked) => updateCustomization('footer.showSignature', checked)}
                    />
                  </div>

                  {customization.footer.showSignature && (
                    <div className="space-y-2">
                      <Label htmlFor="signatureLabel">Signature Label</Label>
                      <Input
                        id="signatureLabel"
                        value={customization.footer.signatureLabel}
                        onChange={(e) => updateCustomization('footer.signatureLabel', e.target.value)}
                        placeholder="Authorized Signatory"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Layout Tab */}
            <TabsContent value="layout" className="space-y-4 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Page Layout</CardTitle>
                  <CardDescription>Configure page size and margins</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pageSize">Page Size</Label>
                      <Select
                        value={customization.pageSize}
                        onValueChange={(value) => updateCustomization('pageSize', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="Letter">Letter</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="orientation">Orientation</Label>
                      <Select
                        value={customization.orientation}
                        onValueChange={(value) => updateCustomization('orientation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <Label className="text-base font-semibold">Margins (in pixels)</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="marginTop">Top</Label>
                        <Input
                          id="marginTop"
                          type="number"
                          value={customization.margins.top}
                          onChange={(e) => updateCustomization('margins.top', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marginRight">Right</Label>
                        <Input
                          id="marginRight"
                          type="number"
                          value={customization.margins.right}
                          onChange={(e) => updateCustomization('margins.right', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marginBottom">Bottom</Label>
                        <Input
                          id="marginBottom"
                          type="number"
                          value={customization.margins.bottom}
                          onChange={(e) => updateCustomization('margins.bottom', parseInt(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="marginLeft">Left</Label>
                        <Input
                          id="marginLeft"
                          type="number"
                          value={customization.margins.left}
                          onChange={(e) => updateCustomization('margins.left', parseInt(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Label>Show Page Numbers</Label>
                    <Switch
                      checked={customization.showPageNumbers}
                      onCheckedChange={(checked) => updateCustomization('showPageNumbers', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
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
