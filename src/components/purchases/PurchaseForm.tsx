/**
 * Purchase Form Component (Tabbed Version)
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PurchaseBill, PurchaseItem } from '@/lib/api/purchases.api';
import { Product, Client, Company } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, FileText, Package, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { calculateTaxBreakdown } from '@/lib/utils/tax-calculator';
import { formatCurrency } from '@/utils/formatters';
import { SearchableClientDropdown } from '@/components/shared';
import { productsApi } from '@/lib/api/products.api';
import SerialManager from '@/components/shared/SerialManager';
import { DocumentUpload } from '@/components/shared/DocumentUpload';
import { TotalsSummary } from '@/components/forms/shared';

const purchaseItemSchema = z.object({ productId: z.string().optional(), productName: z.string().optional(), description: z.string().min(1), hsn: z.string().min(1), quantity: z.coerce.number().int().min(1), unit: z.string().min(1), unitPrice: z.coerce.number().min(0), discount: z.coerce.number().min(0).default(0), gstRate: z.coerce.number().min(0), cessRate: z.coerce.number().min(0).optional() });
const purchaseFormSchema = z.object({ invoiceNumber: z.string().min(1), referenceNumber: z.string().optional(), poNumber: z.string().optional(), poDate: z.string().optional(), ewayNumber: z.string().optional(), date: z.string().min(1), clientId: z.string().min(1), items: z.array(purchaseItemSchema).min(1), attachmentUrl: z.string().nullish() });
type PurchaseFormData = z.infer<typeof purchaseFormSchema>;
type TabKey = 'header' | 'items' | 'summary';

interface PurchaseFormProps { purchase?: PurchaseBill; companyId: string; company?: Company; products: Product[]; clients: Client[]; companyState: string; onSubmit: (data: any) => Promise<void>; onCancel?: () => void; onClientAdded?: (client: Client) => void; }

export function PurchaseForm({ purchase, companyId, company, products, clients, companyState, onSubmit, onCancel, onClientAdded }: PurchaseFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('header');
    const [serialNumbers, setSerialNumbers] = useState<Record<string, string[]>>({});
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>(purchase?.attachmentUrl);
    const [serialModalIndex, setSerialModalIndex] = useState<number | null>(null);

    useEffect(() => { setLocalProducts(products); }, [products]);

    const { register, handleSubmit, setValue, watch, control, clearErrors, trigger, formState: { errors } } = useForm<PurchaseFormData>({
        resolver: zodResolver(purchaseFormSchema) as unknown as Resolver<PurchaseFormData>,
        defaultValues: purchase ? { invoiceNumber: purchase.invoiceNumber, referenceNumber: purchase.referenceNumber || '', poNumber: purchase.poNumber || '', poDate: purchase.poDate ? (typeof purchase.poDate === 'string' ? purchase.poDate.split('T')[0] : '') : '', ewayNumber: purchase.ewayNumber || '', clientId: purchase.clientId, date: purchase.date ? (typeof purchase.date === 'string' ? purchase.date.split('T')[0] : '') : new Date().toISOString().split('T')[0], items: purchase.items.map(i => ({ productId: i.productId || '', productName: i.productName || '', description: i.description || '', hsn: i.hsn || '', quantity: i.quantity, unit: i.unit, unitPrice: i.unitPrice, discount: i.discount || 0, gstRate: i.gstRate, cessRate: i.cessRate || 0 })), attachmentUrl: purchase.attachmentUrl } : { date: new Date().toISOString().split('T')[0], items: [{ productId: '', quantity: '', unit: 'Nos', unitPrice: 0, discount: 0, gstRate: 18 }] } as any,
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'items' });
    const watchItems = watch('items');
    const watchClientId = watch('clientId');

    useEffect(() => {
        if (!purchase || !fields.length) return;
        const map: Record<string, string[]> = {};
        fields.forEach((f, i) => { const it = purchase.items?.[i]; const p = localProducts.find(pr => pr.id === it?.productId); if (p?.hasSerialNumber && it?.serialNumbers?.length) map[f.id] = [...it.serialNumbers]; });
        if (Object.keys(map).length) setSerialNumbers(prev => ({ ...prev, ...map }));
    }, [purchase, localProducts, fields]);

    useEffect(() => { if (watchClientId) setSelectedClient(clients.find(c => c.id === watchClientId) || null); else setSelectedClient(null); }, [watchClientId, clients]);

    const handleProductSelect = async (index: number, productId: string) => {
        const p = localProducts.find(pr => pr.id === productId);
        if (p) { setValue(`items.${index}.productId`, productId); setValue(`items.${index}.productName`, p.productName); setValue(`items.${index}.description`, p.description || p.productName); setValue(`items.${index}.hsn`, p.hsn); setValue(`items.${index}.unit`, p.unit); setValue(`items.${index}.unitPrice`, p.price); setValue(`items.${index}.gstRate`, p.gstRate); setValue(`items.${index}.cessRate`, p.cessRate || 0); }
    };

    const handleQuantityChange = (index: number, quantity: number) => {
        const it = watchItems?.[index], p = it?.productId ? localProducts.find(pr => pr.id === it.productId) : null;
        if (!p || quantity <= 0) return;
        setValue(`items.${index}.quantity`, quantity);
        if (p.hasSerialNumber) { const fid = fields[index]?.id; if (fid && (serialNumbers[fid] || []).length < quantity) setSerialModalIndex(index); }
    };

    const calculateTotals = () => {
        if (!watchItems) return null;
        const valid = watchItems.filter((i: any) => i.productId && i.quantity > 0 && i.unitPrice >= 0);
        if (!valid.length) return null;
        let taxableAmt = 0, cgst = 0, sgst = 0, igst = 0;
        const clientState = selectedClient?.address?.state || '', isInter = companyState !== clientState;
        const items = valid.map((item: any, idx: number) => {
            const p = localProducts.find(pr => pr.id === item.productId); if (!p) return null;
            const qty = Number(item.quantity), price = Number(item.unitPrice), disc = Number(item.discount) || 0, gst = Number(item.gstRate) || 0;
            const base = qty * price, discAmt = (base * disc) / 100, taxable = base - discAmt;
            let c = 0, s = 0, i = 0; if (isInter) i = (taxable * gst) / 100; else { c = s = (taxable * gst / 2) / 100; }
            taxableAmt += taxable; cgst += c; sgst += s; igst += i;
            const pi: any = { product_id: p.id, product_name: p.productName, description: item.description, hsn: item.hsn, quantity: qty, unit: item.unit, unit_price: price, discount: disc, gst_rate: gst, cess_rate: item.cessRate || 0, taxable_amount: taxable, cgst: c, sgst: s, igst: i, line_total: taxable + c + s + i };
            if (p.hasSerialNumber) { const key = fields[idx]?.id; if (key && serialNumbers[key]) pi.serial_numbers = serialNumbers[key]; }
            return pi;
        }).filter(Boolean) as PurchaseItem[];
        return { items, taxableAmount: taxableAmt, cgst, sgst, igst, totalAmount: taxableAmt + cgst + sgst + igst, taxBreakdown: calculateTaxBreakdown(valid.map((i: any) => ({ amount: Number(i.unitPrice), quantity: Number(i.quantity), gstRate: Number(i.gstRate), discount: Number(i.discount) || 0 })), companyState, clientState) };
    };


    const totals = calculateTotals();
    const tabsOrder: TabKey[] = ['header', 'items', 'summary'];

    const goToNext = async (e?: React.MouseEvent) => {
        e?.preventDefault();
        const isValid = await trigger(['clientId', 'invoiceNumber', 'date'] as any);
        if (isValid) {
            const currentIndex = tabsOrder.indexOf(activeTab);
            if (currentIndex < 2) {
                setActiveTab(tabsOrder[currentIndex + 1]);
            }
        } else {
            toast.error('Please fix validation errors');
        }
    };

    const goBack = (e?: React.MouseEvent) => {
        e?.preventDefault();
        const currentIndex = tabsOrder.indexOf(activeTab);
        if (currentIndex > 0) {
            setActiveTab(tabsOrder[currentIndex - 1]);
        }
    };

    const handleFormSubmit = async (data: PurchaseFormData) => {
        console.log('=== handleFormSubmit CALLED ===');
        console.log('Form data received:', data);

        if (!totals) {
            console.log('ERROR: totals is null/undefined');
            toast.error('Please add valid items to the purchase');
            return;
        }

        // Validate serial numbers for products that require them
        let hasErrors = false;
        const errors: Record<string, string> = {};

        watchItems.forEach((item: any, idx: number) => {
            const product = localProducts.find(pr => pr.id === item.productId);
            if (product?.hasSerialNumber) {
                const fieldKey = fields[idx]?.id;
                const serialNums = fieldKey ? (serialNumbers[fieldKey] || []) : [];
                const quantity = Number(item.quantity);

                if (serialNums.length !== quantity) {
                    if (fieldKey) {
                        errors[fieldKey] = `Need ${quantity} serial numbers`;
                    }
                    hasErrors = true;
                }
            }
        });

        if (hasErrors) {
            toast.error('Please fill in all required serial numbers');
            return;
        }

        setIsLoading(true);
        try {
            await onSubmit({
                bill_number: data.invoiceNumber,
                reference_number: data.referenceNumber || null,
                po_number: data.poNumber || null,
                po_date: data.poDate ? new Date(data.poDate).toISOString() : null,
                eway_number: data.ewayNumber || null,
                client_id: data.clientId,
                date: new Date(data.date).toISOString(),
                company_id: companyId,
                items: totals.items,
                taxable_amount: totals.taxableAmount,
                cgst: totals.cgst,
                sgst: totals.sgst,
                igst: totals.igst,
                total_amount: totals.totalAmount,
                tax_breakdown: totals.taxBreakdown,
                status: 'draft',
                payment_status: 'unpaid',
                attachment_url: attachmentUrl
            });
            toast.success(purchase ? 'Purchase bill updated successfully' : 'Purchase bill created successfully');
        } catch (e: any) {
            toast.error(e.response?.data?.detail || 'Failed to save purchase bill');
        } finally {
            setIsLoading(false);
        }
    };

    // Handle form validation errors - show user-friendly message
    const onFormError = (validationErrors: any) => {
        console.error('Form validation errors:', validationErrors);
        console.log('Current form values:', watch());
        console.log('Form errors from formState:', errors);
        console.log('Is form valid?', Object.keys(errors).length === 0);

        // Check if items array is the issue
        const items = watch('items');
        console.log('Items array:', items);

        const firstError = Object.values(validationErrors)[0] as any;
        if (firstError?.message) {
            toast.error(`Validation Error: ${firstError.message}`);
        } else if (firstError?.root?.message) {
            toast.error(`Validation Error: ${firstError.root.message}`);
        } else if (Object.keys(validationErrors).length === 0) {
            // Empty errors object - might be items array issue
            toast.error('Form validation failed. Please ensure all required fields are filled.');
        } else {
            toast.error('Please fix all validation errors before submitting');
        }
    };

    return (
        <form onSubmit={handleSubmit(handleFormSubmit, onFormError)} className="space-y-4 animate-fade-in">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="header" className="gap-2"><FileText className="h-4 w-4" /><span className="hidden sm:inline">Header</span></TabsTrigger>
                    <TabsTrigger value="items" className="gap-2"><Package className="h-4 w-4" /><span className="hidden sm:inline">Items</span></TabsTrigger>
                    <TabsTrigger value="summary" className="gap-2"><ClipboardCheck className="h-4 w-4" /><span className="hidden sm:inline">Summary</span></TabsTrigger>
                </TabsList>

                <TabsContent value="header" className="mt-4 space-y-4">
                    <Card><CardHeader><CardTitle className="text-lg">Purchase Details</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <SearchableClientDropdown clients={clients} selectedClientId={watch('clientId') || ''} onClientSelect={(id) => setValue('clientId', id)} onClientAdded={(c) => { setValue('clientId', c.id); clearErrors('clientId'); onClientAdded?.(c); }} label="Vendor" required error={errors.clientId?.message} companyId={companyId} placeholder="Select vendor..." />
                                <FloatingLabelInput id="invoiceNumber" label="Bill Number *" {...register('invoiceNumber')} error={errors.invoiceNumber?.message} />
                                <FloatingLabelInput id="date" type="date" label="Bill Date *" {...register('date')} error={errors.date?.message} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FloatingLabelInput id="poNumber" label="PO Number" {...register('poNumber')} />
                                <FloatingLabelInput id="poDate" type="date" label="PO Date" {...register('poDate')} />
                                <FloatingLabelInput id="ewayNumber" label="E-way" {...register('ewayNumber')} />
                                <FloatingLabelInput id="referenceNumber" label="Reference" {...register('referenceNumber')} />
                            </div>
                            <div className="pt-4 border-t"><DocumentUpload label="Bill Document" currentDocumentUrl={attachmentUrl} onDocumentUploaded={setAttachmentUrl} onDocumentRemoved={() => setAttachmentUrl(undefined)} /></div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="items" className="mt-4 space-y-4">
                    <Card><CardHeader><CardTitle className="text-lg">Purchase Items</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="hidden lg:block"><table className="w-full"><thead className="border-b"><tr className="text-sm text-muted-foreground"><th className="p-2 text-left w-64">Product</th><th className="p-2 w-16">Qty</th><th className="p-2 w-24">Unit</th><th className="p-2 w-28 text-right">Price</th><th className="p-2 w-16">Disc%</th><th className="p-2 w-28 text-right">Amount</th><th className="p-2 w-10"></th></tr></thead>
                                <tbody>{fields.map((f, i) => {
                                    const it = watchItems?.[i], p = it?.productId ? localProducts.find(pr => pr.id === it.productId) : null, amt = (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0) * (1 - (Number(it?.discount) || 0) / 100);
                                    return (<tr key={f.id} className="border-b align-top"><td className="p-2"><Select value={it?.productId || ''} onValueChange={(v) => handleProductSelect(i, v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{localProducts.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.productName}</SelectItem>)}</SelectContent></Select>{p?.hasSerialNumber && <div className="mt-2"><Button type="button" variant="outline" size="sm" onClick={() => setSerialModalIndex(i)}>Serials</Button><span className="text-xs ml-2">{(serialNumbers[f.id] || []).length} sel</span></div>}</td>

                                        <td className="p-2"><Controller control={control} name={`items.${i}.quantity`} render={({ field }) => <Input type="number" value={field.value ?? ''} onChange={e => { const v = e.target.value === '' ? '' : parseInt(e.target.value); field.onChange(v); if (v && !isNaN(v as number)) handleQuantityChange(i, v as number); }} onBlur={field.onBlur} name={field.name} ref={field.ref} className="text-center" />} /></td>
                                        <td className="p-2"><Controller control={control} name={`items.${i}.unit`} render={({ field }) => <Input value={field.value ?? ''} onChange={field.onChange} onBlur={field.onBlur} name={field.name} ref={field.ref} className="text-center text-sm" />} /></td>
                                        <td className="p-2"><Controller control={control} name={`items.${i}.unitPrice`} render={({ field }) => <Input type="number" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} onBlur={field.onBlur} name={field.name} ref={field.ref} className="text-right" />} /></td>
                                        <td className="p-2"><Controller control={control} name={`items.${i}.discount`} render={({ field }) => <Input type="number" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} onBlur={field.onBlur} name={field.name} ref={field.ref} className="text-center" />} /></td>
                                        <td className="p-2 text-right font-medium">{formatCurrency(amt)}</td>
                                        <td className="p-2"><Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4 text-red-500" /></Button></td></tr>);
                                })}</tbody></table></div>
                            <div className="lg:hidden space-y-4">{fields.map((f, i) => {
                                const it = watchItems?.[i], p = it?.productId ? localProducts.find(pr => pr.id === it.productId) : null, amt = (Number(it?.quantity) || 0) * (Number(it?.unitPrice) || 0) * (1 - (Number(it?.discount) || 0) / 100);
                                return (<Card key={f.id} className="relative"><CardContent className="pt-6 space-y-3"><div className="absolute top-2 right-2"><Button type="button" variant="ghost" size="icon" onClick={() => remove(i)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4 text-red-500" /></Button></div>
                                    <Select value={it?.productId || ''} onValueChange={(v) => handleProductSelect(i, v)}><SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger><SelectContent>{localProducts.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.productName}</SelectItem>)}</SelectContent></Select>
                                    {p?.hasSerialNumber && <Button type="button" variant="outline" size="sm" onClick={() => setSerialModalIndex(i)}>Serials ({(serialNumbers[f.id] || []).length})</Button>}
                                    <div className="grid grid-cols-3 gap-2"><Controller control={control} name={`items.${i}.quantity`} render={({ field }) => <Input type="number" value={field.value ?? ''} placeholder="Qty" className="text-center" onChange={e => { const v = parseInt(e.target.value); field.onChange(isNaN(v) ? '' : v); if (!isNaN(v)) handleQuantityChange(i, v); }} />} /><Controller control={control} name={`items.${i}.unit`} render={({ field }) => <Input value={field.value ?? ''} onChange={field.onChange} placeholder="Unit" className="text-center" />} /><Controller control={control} name={`items.${i}.unitPrice`} render={({ field }) => <Input type="number" value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="Price" className="text-right" />} /></div>
                                    <div className="text-right font-bold">{formatCurrency(amt)}</div></CardContent></Card>);
                            })}</div>
                            <Button type="button" variant="outline" onClick={() => append({ productId: '', quantity: '', unit: 'Nos', unitPrice: 0, discount: 0, gstRate: 18 } as any)} className="w-full"><Plus className="mr-2 h-4 w-4" />Add Item</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="summary" className="mt-4 space-y-4">
                    <Card><CardHeader><CardTitle className="text-lg">Review</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {/* Header Overview */}
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <span className="text-muted-foreground block text-xs">Bill #</span>
                                    <span className="font-semibold">{watch('invoiceNumber')}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block text-xs">Date</span>
                                    <span className="font-semibold">{watch('date')}</span>
                                </div>
                            </div>

                            {selectedClient && (
                                <div className="p-4 bg-muted/30 rounded-lg border border-border/50 mb-4">
                                    <h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><FileText className="h-3 w-3" /> Vendor Details</h4>
                                    <p className="text-sm font-medium">{selectedClient.clientName}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{selectedClient.address.city}, {selectedClient.address.state}</p>
                                </div>
                            )}

                            {/* Items Summary Table */}
                            {watchItems && watchItems.length > 0 && (
                                <div className="rounded-md border text-xs mb-4">
                                    <div className="grid grid-cols-12 bg-muted/50 p-2 font-medium border-b">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-5">Product</div>
                                        <div className="col-span-2 text-right">Qty</div>
                                        <div className="col-span-2 text-right">Price</div>
                                        <div className="col-span-2 text-right">Total</div>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto">
                                        {watchItems.map((item, idx) => {
                                            const p = localProducts.find(pr => pr.id === item.productId);
                                            if (!p) return null;
                                            const disc = item.discount || 0;
                                            // For purchase, discount usually reduces base
                                            const base = (item.quantity * item.unitPrice);
                                            const total = base - (base * disc / 100);

                                            return (
                                                <div key={idx} className="grid grid-cols-12 p-2 border-b last:border-0 items-center hover:bg-muted/20">
                                                    <div className="col-span-1 text-muted-foreground">{idx + 1}</div>
                                                    <div className="col-span-5 truncate font-medium">
                                                        {p.productName}
                                                        {p.hasSerialNumber && <span className="ml-1 text-[10px] text-primary bg-primary/10 px-1 rounded">SN</span>}
                                                    </div>
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

            <SerialManager open={serialModalIndex !== null} onClose={() => setSerialModalIndex(null)} productId={serialModalIndex !== null ? watchItems?.[serialModalIndex]?.productId : undefined} initialSelected={serialModalIndex !== null ? (fields[serialModalIndex]?.id ? (serialNumbers[fields[serialModalIndex].id] || []) : []) : []} quantity={serialModalIndex !== null ? Number(watchItems?.[serialModalIndex]?.quantity) || 0 : 0} fetchFromDb={false} claimFromDb={false} onSave={async (sel) => { if (serialModalIndex === null) return; const k = fields[serialModalIndex]?.id; if (k) setSerialNumbers(prev => ({ ...prev, [k]: sel })); }} />

            <div className="flex justify-between pt-4 border-t">
                <div>{activeTab !== 'header' && <Button type="button" variant="outline" onClick={goBack}>Back</Button>}</div>
                <div className="flex gap-3">
                    {onCancel && <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>}
                    {activeTab !== 'summary' ? <Button type="button" onClick={goToNext}>Next</Button> : <Button type="submit" disabled={isLoading || !totals} className="bg-gradient-to-r from-primary to-accent text-white">{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{purchase ? 'Update' : 'Create'} Purchase</Button>}
                </div>
            </div>
        </form>
    );
}

export default PurchaseForm;
