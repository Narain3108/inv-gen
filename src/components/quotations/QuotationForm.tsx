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
import { TotalsSummary, ShippingAddressSection, ShippingAddressMode } from '@/components/forms/shared';

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
            return { productId: p.id, description: p.productName, hsn: p.hsn, quantity: qty, unit: item.unit || p.unit, unitPrice: price, discount: disc, gstRate: p.gstRate, taxableAmount: taxable, cgst: c, sgst: s, igst: i, lineTotal: taxable + c + s + i } as InvoiceItem;
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
                                    <p className="text-xs text-muted-foreground mt-1">Auto-filled</p>
                                </div>
                                <SearchableClientDropdown clients={clients} selectedClientId={watch('clientId') || ''} onClientSelect={(id) => setValue('clientId', id)} onClientAdded={(c) => { setValue('clientId', c.id); clearErrors('clientId'); onClientAdded?.(c); }} label="Client" required error={errors.clientId?.message} companyId={companyId} placeholder="Select client..." />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FloatingLabelInput id="date" type="date" label="Date *" {...register('date')} error={errors.date?.message} />
                                <div>
                                    <FloatingLabelInput id="validUntil" type="date" label="Valid Until *" {...register('validUntil')} />
                                    <p className="text-xs text-muted-foreground mt-1">Default: 30 days</p>
                                </div>
                            </div>
                            {selectedClient && <ShippingAddressSection client={selectedClient} mode={shippingAddressMode} onModeChange={setShippingAddressMode} selectedAddressIndex={selectedAddressIndex} onSelectedAddressChange={setSelectedAddressIndex} newAddress={newShippingAddress} onNewAddressChange={setNewShippingAddress} />}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="items" className="mt-4 space-y-4">
                    <Card><CardHeader><CardTitle className="text-lg">Line Items</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="hidden lg:block"><table className="w-full"><thead className="border-b"><tr className="text-sm text-muted-foreground"><th className="p-2 text-left w-64">Product</th><th className="p-2 w-16">Qty</th><th className="p-2 w-24">Unit</th><th className="p-2 w-28 text-right">Price</th><th className="p-2 w-16">Disc%</th><th className="p-2 w-28 text-right">Amount</th><th className="p-2 w-10"></th></tr></thead>
                                <tbody>{fields.map((f, i) => {
                                    const it = watchItems?.[i], p = it?.productId ? localProducts.find(pr => pr.id === it.productId) : null, amt = (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0) * (1 - (Number(it?.discount) || 0) / 100);
                                    return (<tr key={f.id} className="border-b"><td className="p-2"><Select value={it?.productId || ''} onValueChange={(v) => handleProductSelect(i, v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{localProducts.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.productName}</SelectItem>)}</SelectContent></Select></td>
                                        <td className="p-2"><Controller control={control} name={`items.${i}.quantity`} render={({ field }) => <Input type="number" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value))} onBlur={field.onBlur} name={field.name} ref={field.ref} className="text-center" />} /></td>
                                        <td className="p-2"><Controller control={control} name={`items.${i}.unit`} render={({ field }) => <Input value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="text-center text-sm" />} /></td>
                                        <td className="p-2"><Controller control={control} name={`items.${i}.unitPrice`} render={({ field }) => <Input type="number" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} onBlur={field.onBlur} name={field.name} ref={field.ref} className="text-right" />} /></td>
                                        <td className="p-2"><Controller control={control} name={`items.${i}.discount`} render={({ field }) => <Input type="number" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} onBlur={field.onBlur} name={field.name} ref={field.ref} className="text-center" />} /></td>
                                        <td className="p-2 text-right font-medium">{formatCurrency(amt)}</td>
                                        <td className="p-2"><Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4 text-red-500" /></Button></td></tr>);
                                })}</tbody></table></div>
                            <div className="lg:hidden space-y-4">{fields.map((f, i) => {
                                const it = watchItems?.[i], amt = (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0) * (1 - (Number(it?.discount) || 0) / 100);
                                return (<Card key={f.id} className="relative"><CardContent className="pt-6 space-y-3"><div className="absolute top-2 right-2"><Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                                    <Select value={it?.productId || ''} onValueChange={(v) => handleProductSelect(i, v)}><SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger><SelectContent>{localProducts.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.productName}</SelectItem>)}</SelectContent></Select>
                                    <div className="grid grid-cols-3 gap-2"><Controller control={control} name={`items.${i}.quantity`} render={({ field }) => <Input type="number" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value))} placeholder="Qty" className="text-center" />} /><Controller control={control} name={`items.${i}.unit`} render={({ field }) => <Input value={field.value ?? ''} onChange={field.onChange} placeholder="Unit" className="text-center" />} /><Controller control={control} name={`items.${i}.unitPrice`} render={({ field }) => <Input type="number" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Price" className="text-right" />} /></div>
                                    <div className="text-right font-bold">{formatCurrency(amt)}</div></CardContent></Card>);
                            })}</div>
                            <Button type="button" variant="outline" onClick={() => append({ productId: '' } as any)} className="w-full"><Plus className="mr-2 h-4 w-4" />Add Item</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="summary" className="mt-4 space-y-4">
                    <Card><CardHeader><CardTitle className="text-lg">Review</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {selectedClient && <div className="p-4 bg-muted/30 rounded-lg"><h4 className="font-semibold">Client</h4><p className="text-sm">{selectedClient.clientName}</p><p className="text-sm text-muted-foreground">{selectedClient.address.city}, {selectedClient.address.state}</p></div>}
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
