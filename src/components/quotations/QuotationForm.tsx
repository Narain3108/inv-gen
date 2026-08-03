/**
 * Quotation Form Component (Tabbed Version)
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { quotationFormSchema } from '@/lib/validations';
import { Quotation, Product, Client, InvoiceItem, Company, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, FileText, Package, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/formatters';
import { SearchableClientDropdown } from '@/components/shared';
import { calculateTaxBreakdown } from '@/lib/utils/tax-calculator';
import { generateQuotationNumber } from '@/lib/utils/numbering-utils';
import { z } from 'zod';
import { clientsApi } from '@/lib/api/clients.api';
import { TotalsSummary, ShippingAddressSection, ShippingAddressMode, FormItemRow } from '@/components/forms/shared';

type QuotationFormData = z.infer<typeof quotationFormSchema>;
type TabKey = 'header' | 'items' | 'summary';

interface QuotationFormProps {
    quotation?: Quotation;
    companyId: string;
    company?: Company;
    products: Product[];
    clients: Client[];
    companyState: string;
    quotationCount?: number;
    onSubmit: (data: QuotationFormData) => Promise<void>;
    onCancel?: () => void;
    onClientAdded?: (client: Client) => void;
}

export function QuotationForm({ quotation, companyId, company, products, clients, companyState, quotationCount = 0, onSubmit, onCancel, onClientAdded }: QuotationFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('header');
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const [shippingAddressMode, setShippingAddressMode] = useState<ShippingAddressMode>('none');
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<string>('default');
    const [newShippingAddress, setNewShippingAddress] = useState<Address>({ street: '', city: '', state: '', pincode: '', country: 'India' });

    useEffect(() => { setLocalProducts(products); }, [products]);

    const getDefaultValidUntil = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; };

    const { register, handleSubmit, setValue, watch, control, clearErrors, trigger, formState: { errors } } = useForm<QuotationFormData>({
        resolver: zodResolver(quotationFormSchema) as any,
        defaultValues: quotation ? {
            quotationNumber: quotation.quotationNumber, clientId: quotation.clientId,
            date: typeof quotation.date === 'string' ? quotation.date.split('T')[0] : new Date().toISOString().split('T')[0],
            validUntil: typeof quotation.validUntil === 'string' ? quotation.validUntil.split('T')[0] : getDefaultValidUntil(),
            items: quotation.items.map(i => ({ productId: i.productId || '', quantity: i.quantity, unitPrice: i.unitPrice, discount: i.discount || 0 })),
        } : { date: new Date().toISOString().split('T')[0], validUntil: getDefaultValidUntil(), items: [{ productId: '' }] } as any,
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'items' });
    const watchItems = watch('items');
    const watchClientId = watch('clientId');

    useEffect(() => { if (!quotation && company) setValue('quotationNumber', generateQuotationNumber(company, quotationCount)); }, [quotation, company, quotationCount, setValue]);

    useEffect(() => {
        if (watchClientId) { setSelectedClient(clients.find(c => c.id === watchClientId) || null); setShippingAddressMode('none'); }
        else setSelectedClient(null);
    }, [watchClientId, clients]);

    const handleProductSelect = (index: number, productId: string) => {
        const p = localProducts.find(pr => pr.id === productId);
        if (p) { setValue(`items.${index}.productId`, productId); setValue(`items.${index}.unitPrice`, p.price); setValue(`items.${index}.unit`, p.unit); }
    };

    const handleQuantityChange = (index: number, quantity: number) => {
        setValue(`items.${index}.quantity`, quantity);
    };

    const calculateTotals = () => {
        if (!watchItems || !selectedClient) return null;
        const validItems = watchItems.filter((i: any) => i.productId && i.quantity > 0 && i.unitPrice >= 0);
        if (validItems.length === 0) return null;
        let taxableAmt = 0, cgst = 0, sgst = 0, igst = 0;
        const isInter = companyState !== selectedClient.address.state;
        const items = validItems.map((item: any) => {
            const p = localProducts.find(pr => pr.id === item.productId); if (!p) return null;
            const qty = Number(item.quantity), price = Number(item.unitPrice), disc = Number(item.discount) || 0;
            const base = qty * price, discAmt = (base * disc) / 100, taxable = base - discAmt;
            let c = 0, s = 0, i = 0;
            if (isInter) i = (taxable * p.gstRate) / 100; else { c = s = (taxable * p.gstRate / 2) / 100; }
            taxableAmt += taxable; cgst += c; sgst += s; igst += i;
            return { productId: p.id, description: p.productName, productDescription: p.description || '', hsn: p.hsn, quantity: qty, unit: item.unit || p.unit, unitPrice: price, discount: disc, gstRate: p.gstRate, taxableAmount: taxable, cgst: c, sgst: s, igst: i, lineTotal: taxable + c + s + i } as InvoiceItem;
        }).filter(Boolean) as InvoiceItem[];
        return { items, taxableAmount: taxableAmt, cgst, sgst, igst, totalAmount: taxableAmt + cgst + sgst + igst, taxBreakdown: calculateTaxBreakdown(validItems.map((i: any) => ({ amount: Number(i.unitPrice), quantity: Number(i.quantity), gstRate: localProducts.find(p => p.id === i.productId)?.gstRate || 0, discount: Number(i.discount) || 0 })), companyState, selectedClient.address.state) };
    };

    const totals = calculateTotals();
    const tabsOrder: TabKey[] = ['header', 'items', 'summary'];
    const goToNext = async (e?: React.MouseEvent) => { e?.preventDefault(); if (await trigger(['clientId', 'quotationNumber', 'date', 'validUntil'] as any)) { const i = tabsOrder.indexOf(activeTab); if (i < 2) setActiveTab(tabsOrder[i + 1]); } else toast.error('Fix errors first'); };
    const goBack = (e?: React.MouseEvent) => { e?.preventDefault(); const i = tabsOrder.indexOf(activeTab); if (i > 0) setActiveTab(tabsOrder[i - 1]); };

    const handleFormSubmit = async (data: QuotationFormData) => {
        if (!totals) { toast.error('Add valid items'); return; }
        let shipAddr: Address | undefined;
        if (shippingAddressMode === 'default') shipAddr = selectedClient?.shippingAddress || selectedClient?.address;
        else if (shippingAddressMode === 'select' && selectedClient?.shippingAddresses) { const idx = parseInt(selectedAddressIndex); if (!isNaN(idx)) shipAddr = selectedClient.shippingAddresses[idx]; }
        else if (shippingAddressMode === 'new') { if (!newShippingAddress.street || !newShippingAddress.city) { toast.error('Fill shipping fields'); return; } shipAddr = newShippingAddress; }
        setIsLoading(true);
        try {
            await onSubmit({ quotationNumber: data.quotationNumber, clientId: data.clientId, date: data.date, validUntil: data.validUntil, companyId, shippingAddress: shippingAddressMode === 'none' ? null : shipAddr, items: totals.items, taxableAmount: totals.taxableAmount, cgst: totals.cgst, sgst: totals.sgst, igst: totals.igst, totalAmount: totals.totalAmount, taxBreakdown: totals.taxBreakdown, status: 'pending' } as any);
            toast.success(quotation ? 'Quotation updated' : 'Quotation created');
        } catch (e: any) { toast.error(e.response?.data?.detail || 'Failed'); } finally { setIsLoading(false); }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 animate-fade-in">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="header" className="gap-2"><FileText className="h-4 w-4" /><span className="hidden sm:inline">Header</span></TabsTrigger>
                    <TabsTrigger value="items" className="gap-2"><Package className="h-4 w-4" /><span className="hidden sm:inline">Items</span></TabsTrigger>
                    <TabsTrigger value="summary" className="gap-2"><ClipboardCheck className="h-4 w-4" /><span className="hidden sm:inline">Summary</span></TabsTrigger>
                </TabsList>

                <TabsContent value="header" className="mt-4 space-y-4">
                    <Card><CardHeader><CardTitle className="text-lg">Quotation Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <FloatingLabelInput id="quotationNumber" label="Quotation Number" {...register('quotationNumber')} error={errors.quotationNumber?.message} />

                                </div>
                                <SearchableClientDropdown clients={clients} selectedClientId={watch('clientId') || ''} onClientSelect={(id) => setValue('clientId', id)} onClientAdded={(c) => { setValue('clientId', c.id); clearErrors('clientId'); onClientAdded?.(c); }} label="Client" required error={errors.clientId?.message} companyId={companyId} placeholder="Select client..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FloatingLabelInput id="date" type="date" label="Date *" {...register('date')} error={errors.date?.message} />
                                <div>
                                    <FloatingLabelInput id="validUntil" type="date" label="Valid Until *" {...register('validUntil')} />

                                </div>
                            </div>
                            {selectedClient && <ShippingAddressSection client={selectedClient} mode={shippingAddressMode} onModeChange={setShippingAddressMode} selectedAddressIndex={selectedAddressIndex} onSelectedAddressChange={setSelectedAddressIndex} newAddress={newShippingAddress} onNewAddressChange={setNewShippingAddress} />}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="items" className="mt-4 space-y-4">
                    <Card><CardHeader><CardTitle className="text-lg">Line Items</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {/* Use FormItemRow for consistent searchable dropdowns with Add New */}
                            <div className="space-y-4">
                                {fields.map((f, i) => (
                                    <FormItemRow
                                        key={f.id}
                                        index={i}
                                        fieldId={f.id}
                                        control={control}
                                        products={localProducts}
                                        companyId={companyId}
                                        watchItem={watchItems?.[i] || {}}
                                        onProductSelect={handleProductSelect}
                                        onQuantityChange={handleQuantityChange}
                                        onRemove={remove}
                                        onProductAdded={(product) => {
                                            setLocalProducts(prev => [...prev, product]);
                                            handleProductSelect(i, product.id);
                                        }}
                                        canRemove={fields.length > 1}
                                        error={errors.items?.[i]}
                                        showSerialButton={false}
                                    />
                                ))}
                            </div>
                            <Button type="button" variant="outline" onClick={() => append({ productId: '' } as any)} className="w-full"><Plus className="mr-2 h-4 w-4" />Add Item</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="summary" className="mt-4 space-y-4">
                    <Card><CardHeader><CardTitle className="text-lg">Review</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {/* Header Overview */}
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <span className="text-muted-foreground block text-xs">Quotation #</span>
                                    <span className="font-semibold">{watch('quotationNumber')}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Valid Until</span>
                                    <span className="font-semibold">{watch('validUntil')}</span>
                                </div>
                            </div>

                            {selectedClient && (
                                <div className="p-4 bg-muted/30 rounded-lg border border-border/50 mb-4">
                                    <h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><FileText className="h-3 w-3" /> Client Details</h4>
                                    <p className="text-sm font-medium">{selectedClient.clientName}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{selectedClient.address.city}, {selectedClient.address.state}</p>
                                </div>
                            )}

                            {/* Items Summary Table */}
                            {watchItems && watchItems.length > 0 && (
                                <div className="rounded-md border text-xs mb-4">
                                    <div className="grid grid-cols-12 bg-muted/50 p-2 font-medium border-b">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-5">Product/Service</div>
                                        <div className="col-span-2 text-right">Qty</div>
                                        <div className="col-span-2 text-right">Price</div>
                                        <div className="col-span-2 text-right">Total</div>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                        {watchItems.map((item, idx) => {
                                            const p = localProducts.find(pr => pr.id === item.productId);
                                            if (!p) return null;
                                            const total = (item.quantity * item.unitPrice) * (1 - (item.discount || 0) / 100);
                                            return (
                                                <div key={idx} className="grid grid-cols-12 p-2 border-b last:border-0 items-center hover:bg-muted/20">
                                                    <div className="col-span-1 text-muted-foreground">{idx + 1}</div>
                                                    <div className="col-span-5 truncate font-medium">{p.productName}</div>
                                                    <div className="col-span-2 text-right">{item.quantity} {item.unit}</div>
                                                    <div className="col-span-2 text-right">{formatCurrency(item.unitPrice)}</div>
                                                    <div className="col-span-2 text-right font-semibold">{formatCurrency(total)}</div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {totals ? <TotalsSummary taxableAmount={totals.taxableAmount} cgst={totals.cgst} sgst={totals.sgst} igst={totals.igst} totalAmount={totals.totalAmount} taxBreakdown={totals.taxBreakdown} isInterState={companyState !== selectedClient?.address?.state} /> : <p className="text-center py-8 text-muted-foreground">No items</p>}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-between pt-4 border-t">
                <div>{activeTab !== 'header' && <Button type="button" variant="outline" onClick={goBack}>Back</Button>}</div>
                <div className="flex gap-3">
                    {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
                    {activeTab !== 'summary' ? <Button type="button" onClick={goToNext}>Next</Button> : <Button type="submit" disabled={isLoading || !totals} className="bg-gradient-to-r from-primary to-accent text-white">{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{quotation ? 'Update' : 'Create'} Quotation</Button>}
                </div>
            </div>
        </form>
    );
}

export default QuotationForm;
