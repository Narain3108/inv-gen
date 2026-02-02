/**
 * Invoice Form Component (Tabbed Version)
 * Comprehensive form for creating/editing invoices
 * 
 * Structure:
 * - Tab 1: Header (Client, Dates, Shipping, References)
 * - Tab 2: Items (Products/Services with Serial Management)
 * - Tab 3: Summary (Review & Submit)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { invoiceFormSchema } from '@/lib/validations';
import { Invoice, Product, Client, Company, InvoiceItem, Address } from '@/types';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { FloatingLabelInput } from '@/components/ui/floating-label-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Plus, Trash2, MapPin, FileText, Package, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { calculateTaxBreakdown } from '@/lib/utils/tax-calculator';
import { formatCurrency } from '@/utils/formatters';
import { SearchableClientDropdown } from '@/components/shared';
import { generateInvoiceNumber } from '@/lib/utils/numbering-utils';
import { z } from 'zod';
import { clientsApi } from '@/lib/api/clients.api';
import { productsApi } from '@/lib/api/products.api';
import { invoicesApi } from '@/lib/api/invoices.api';
import SerialManager from '@/components/shared/SerialManager';
import { OutOfStockDialog } from '@/components/shared/OutOfStockDialog';
import { TotalsSummary, ShippingAddressSection, ShippingAddressMode, FormItemRow } from '@/components/forms/shared';

type InvoiceFormData = z.infer<typeof invoiceFormSchema>;
type TabKey = 'header' | 'items' | 'summary';

interface InvoiceFormProps {
    invoice?: Invoice;
    companyId: string;
    company?: Company;
    products: Product[];
    clients: Client[];
    companyState: string;
    invoiceCount?: number;
    onSubmit: (data: InvoiceFormData) => Promise<void>;
    onCancel?: () => void;
    onClientAdded?: (client: Client) => void;
    prefillData?: Partial<InvoiceFormData>;
}

export function InvoiceForm({
    invoice,
    companyId,
    company,
    products,
    clients,
    companyState,
    invoiceCount = 0,
    onSubmit,
    onCancel,
    onClientAdded,
    prefillData,
}: InvoiceFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [activeTab, setActiveTab] = useState<TabKey>('header');
    const [serialNumbers, setSerialNumbers] = useState<Record<string, string[]>>({});
    const [serialNumberErrors, setSerialNumberErrors] = useState<Record<string, string>>({});
    const [originalItems, setOriginalItems] = useState<Record<string, { productId: string; quantity: number }>>({});
    const [localProducts, setLocalProducts] = useState<Product[]>(products);
    const [activeRowIndex, setActiveRowIndex] = useState<number | null>(null);
    const [serialModalIndex, setSerialModalIndex] = useState<number | null>(null);

    // Out of Stock Dialog
    const [outOfStockDialogOpen, setOutOfStockDialogOpen] = useState(false);
    const [outOfStockData, setOutOfStockData] = useState<{
        product: Product;
        requestedQuantity: number;
        availableStock: number;
        itemIndex: number;
    } | null>(null);

    // Shipping Address
    const [shippingAddressMode, setShippingAddressMode] = useState<ShippingAddressMode>('none');
    const [selectedAddressIndex, setSelectedAddressIndex] = useState<string>('default');
    const [newShippingAddress, setNewShippingAddress] = useState<Address>({
        street: '', city: '', state: '', pincode: '', country: 'India',
    });

    useEffect(() => { setLocalProducts(products); }, [products]);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        control,
        clearErrors,
        setError,
        trigger,
        formState: { errors },
    } = useForm<InvoiceFormData>({
        resolver: zodResolver(invoiceFormSchema) as any,
        defaultValues: invoice ? {
            invoiceNumber: invoice.invoiceNumber,
            referenceNumber: invoice.referenceNumber || '',
            poNumber: invoice.poNumber || '',
            poDate: (() => {
                if (!invoice.poDate) return '';
                if (typeof invoice.poDate === 'string') return invoice.poDate.split('T')[0];
                const dateObj = invoice.poDate instanceof Date ? invoice.poDate : new Date(invoice.poDate);
                return isNaN(dateObj.getTime()) ? '' : dateObj.toISOString().split('T')[0];
            })(),
            ewayNumber: invoice.ewayNumber || '',
            clientId: invoice.clientId,
            date: (() => {
                if (!invoice.date) return new Date().toISOString().split('T')[0];
                if (typeof invoice.date === 'string') return invoice.date.split('T')[0];
                const dateObj = invoice.date instanceof Date ? invoice.date : new Date(invoice.date);
                return isNaN(dateObj.getTime()) ? new Date().toISOString().split('T')[0] : dateObj.toISOString().split('T')[0];
            })(),
            items: invoice.items.map((item) => ({
                productId: item.productId || '',
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discount: item.discount || 0,
            })),
        } : {
            date: new Date().toISOString().split('T')[0],
            items: [{ productId: '' }],
            ...prefillData,
        } as any,
    });

    const { fields, append, remove } = useFieldArray({ control, name: 'items' });

    // Load serial numbers for edit mode
    useEffect(() => {
        if (!invoice || !fields || fields.length === 0) return;
        const serialMap: Record<string, string[]> = {};
        const origItems: Record<string, { productId: string; quantity: number }> = {};

        fields.forEach((field, idx) => {
            const invItem = (invoice.items || [])[idx];
            if (!invItem) return;
            const product = localProducts.find((p) => p.id === invItem.productId);
            if (product?.hasSerialNumber === true && Array.isArray(invItem.serialNumbers) && invItem.serialNumbers.length > 0) {
                serialMap[field.id] = [...invItem.serialNumbers];
            }
            origItems[field.id] = { productId: invItem.productId || '', quantity: Number(invItem.quantity || 0) };
        });

        if (Object.keys(serialMap).length > 0) setSerialNumbers((prev) => ({ ...prev, ...serialMap }));
        setOriginalItems((prev) => ({ ...prev, ...origItems }));
    }, [invoice, localProducts, fields]);

    const watchItems = watch('items');
    const watchClientId = watch('clientId');

    // Auto-fill invoice number
    useEffect(() => {
        const fetchNextNumber = async () => {
            if (!invoice && companyId) {
                try {
                    const { invoice_number } = await invoicesApi.generateNumber(companyId);
                    setValue('invoiceNumber', invoice_number);
                } catch (error) {
                    if (company) {
                        const autoNumber = generateInvoiceNumber(company, invoiceCount);
                        setValue('invoiceNumber', autoNumber);
                    }
                }
            }
        };
        fetchNextNumber();
    }, [invoice, companyId, company, invoiceCount, setValue]);

    // Update selected client
    useEffect(() => {
        if (watchClientId) {
            const client = clients.find(c => c.id === watchClientId);
            setSelectedClient(client || null);
            setShippingAddressMode('none');
            setSelectedAddressIndex('default');
            setNewShippingAddress({ street: '', city: '', state: '', pincode: '', country: 'India' });
        } else {
            setSelectedClient(null);
        }
    }, [watchClientId, clients]);

    const handleProductSelect = async (index: number, productId: string) => {
        const product = localProducts.find(p => p.id === productId);
        if (product) {
            setValue(`items.${index}.productId`, productId);
            setValue(`items.${index}.unitPrice`, product.price);
            setValue(`items.${index}.unit`, product.unit);
            try {
                const freshProduct = await productsApi.getById(productId);
                if (freshProduct) {
                    setLocalProducts(prev => prev.map(p => p.id === freshProduct.id ? freshProduct : p));
                }
            } catch (error) {
                console.error("Failed to refresh product details", error);
            }
        }
    };

    const handleQuantityChange = (index: number, quantity: number) => {
        const item = watchItems?.[index];
        const product = item?.productId ? localProducts.find(p => p.id === item.productId) : null;

        if (!product || quantity <= 0 || isNaN(quantity)) return;

        const isEdit = !!invoice;
        const fieldId = fields?.[index]?.id;

        if (isEdit && product.type === 'product') {
            const origItem = fieldId ? originalItems[fieldId] : null;
            const q_old = (origItem && origItem.productId === product.id) ? origItem.quantity : 0;
            const s_db = product.stock !== undefined ? product.stock : 0;
            const available_for_edit = s_db + q_old;

            if (quantity > available_for_edit) {
                setError(`items.${index}.quantity` as any, {
                    type: 'manual',
                    message: `Insufficient stock. Max: ${available_for_edit}`,
                });
                toast.error(`Insufficient stock. Max: ${available_for_edit}`);
                return;
            } else {
                clearErrors(`items.${index}.quantity` as any);
            }
        } else if (!isEdit && product.type === 'product') {
            if (product.stock !== undefined && quantity > product.stock) {
                setOutOfStockData({ product, requestedQuantity: quantity, availableStock: product.stock, itemIndex: index });
                setOutOfStockDialogOpen(true);
                return;
            }
        }

        setValue(`items.${index}.quantity`, quantity);

        if (product.hasSerialNumber) {
            const currentSerials = fieldId ? (serialNumbers[fieldId] || []) : [];
            if (quantity > currentSerials.length) {
                setSerialModalIndex(index);
            }
        }
    };

    const handleOutOfStockProceed = () => {
        if (outOfStockData) {
            if (outOfStockData.product.hasSerialNumber) {
                setSerialModalIndex(outOfStockData.itemIndex);
            }
            setOutOfStockDialogOpen(false);
            setOutOfStockData(null);
        }
    };

    // Calculate totals
    const calculateTotals = () => {
        if (!watchItems || !selectedClient) return null;

        const validItems = watchItems.reduce((acc: Array<{ item: any; index: number }>, item: any, idx: number) => {
            if (item.productId && item.quantity > 0 && item.unitPrice >= 0) {
                acc.push({ item, index: idx });
            }
            return acc;
        }, []);

        if (validItems.length === 0) return null;

        let totalTaxableAmount = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;
        let totalCess = 0;

        const isInterState = companyState !== selectedClient.address.state;

        const processedItems: InvoiceItem[] = validItems.map(({ item, index }) => {
            const product = localProducts.find(p => p.id === item.productId);
            if (!product) return null;

            const quantity = Number(item.quantity) || 0;
            const unitPrice = Number(item.unitPrice) || 0;
            const discount = Number(item.discount) || 0;

            const baseAmount = quantity * unitPrice;
            const discountAmount = (baseAmount * discount) / 100;
            const taxableAmount = baseAmount - discountAmount;

            let cgst = 0, sgst = 0, igst = 0, cess = 0;

            if (isInterState) {
                igst = (taxableAmount * product.gstRate) / 100;
            } else {
                const halfRate = product.gstRate / 2;
                cgst = (taxableAmount * halfRate) / 100;
                sgst = (taxableAmount * halfRate) / 100;
            }

            if (product.cessRate) {
                cess = (taxableAmount * product.cessRate) / 100;
            }

            const lineTotal = taxableAmount + cgst + sgst + igst + cess;

            totalTaxableAmount += taxableAmount;
            totalCgst += cgst;
            totalSgst += sgst;
            totalIgst += igst;
            totalCess += cess;

            const invoiceItem: any = {
                productId: product.id,
                description: product.productName,
                productDescription: product.description || '',
                hsn: product.hsn,
                quantity,
                unit: item.unit || product.unit,
                unitPrice,
                discount,
                gstRate: product.gstRate,
                cessRate: product.cessRate || 0,
                taxableAmount,
                cgst,
                sgst,
                igst,
                cess,
                lineTotal,
            };

            if (product.itemCode) invoiceItem.itemCode = product.itemCode;

            if (product.hasSerialNumber === true) {
                const key = fields?.[index]?.id;
                if (key && serialNumbers[key]) {
                    invoiceItem.serialNumbers = serialNumbers[key];
                }
            }

            return invoiceItem;
        }).filter(Boolean) as InvoiceItem[];

        const grandTotal = totalTaxableAmount + totalCgst + totalSgst + totalIgst + totalCess;

        const taxBreakdown = calculateTaxBreakdown(
            validItems.map(({ item }) => ({
                amount: Number(item.unitPrice) || 0,
                quantity: Number(item.quantity) || 0,
                gstRate: localProducts.find(p => p.id === item.productId)?.gstRate || 0,
                discount: Number(item.discount) || 0,
            })),
            companyState,
            selectedClient.address.state
        );

        return {
            items: processedItems,
            taxableAmount: totalTaxableAmount,
            cgst: totalCgst,
            sgst: totalSgst,
            igst: totalIgst,
            totalAmount: grandTotal,
            totalAmountInWords: '',
            taxBreakdown,
        };
    };

    const totals = calculateTotals();

    // Tab navigation
    const tabsOrder: TabKey[] = ['header', 'items', 'summary'];
    const fieldsPerTab: Record<TabKey, string[]> = {
        header: ['clientId', 'invoiceNumber', 'date'],
        items: ['items'],
        summary: [],
    };

    const goToNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const valid = await trigger(fieldsPerTab[activeTab] as any);
        if (!valid) {
            toast.error('Please fix errors before proceeding');
            return;
        }
        const idx = tabsOrder.indexOf(activeTab);
        if (idx >= 0 && idx < tabsOrder.length - 1) {
            setActiveTab(tabsOrder[idx + 1]);
        }
    };

    const goBack = (e?: React.MouseEvent<HTMLButtonElement>) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        const idx = tabsOrder.indexOf(activeTab);
        if (idx > 0) {
            setActiveTab(tabsOrder[idx - 1]);
        }
    };

    const handleFormSubmit = async (data: InvoiceFormData) => {
        if (!totals || totals.items.length === 0) {
            toast.error('Please add valid items to the invoice');
            return;
        }

        // Validate serial numbers
        let hasSerialNumberError = false;
        const newErrors: Record<string, string> = {};

        watchItems.forEach((item: any, index: number) => {
            const product = localProducts.find((p) => p.id === item.productId);
            if (product?.hasSerialNumber === true) {
                const key = fields?.[index]?.id;
                const itemSerialNumbers = key ? (serialNumbers[key] || []) : [];
                const quantity = Number(item.quantity) || 0;

                if (itemSerialNumbers.length !== quantity) {
                    if (key) newErrors[key] = `Please enter ${quantity} serial number(s)`;
                    hasSerialNumberError = true;
                } else if (itemSerialNumbers.some((sn) => !sn || sn.trim() === '')) {
                    if (key) newErrors[key] = `Serial numbers cannot be empty`;
                    hasSerialNumberError = true;
                }
            }
        });

        setSerialNumberErrors(newErrors);

        if (hasSerialNumberError) {
            toast.error('Please fill in all required serial numbers');
            return;
        }

        // Determine Shipping Address
        let finalShippingAddress: Address | undefined = undefined;

        if (shippingAddressMode === 'default') {
            finalShippingAddress = selectedClient?.shippingAddress || selectedClient?.address;
        } else if (shippingAddressMode === 'select' && selectedClient?.shippingAddresses) {
            const index = parseInt(selectedAddressIndex);
            if (!isNaN(index) && selectedClient.shippingAddresses[index]) {
                finalShippingAddress = selectedClient.shippingAddresses[index];
            }
        } else if (shippingAddressMode === 'new') {
            if (!newShippingAddress.street || !newShippingAddress.city || !newShippingAddress.state || !newShippingAddress.pincode) {
                toast.error('Please fill in all shipping address fields');
                return;
            }
            finalShippingAddress = newShippingAddress;
            if (selectedClient) {
                try {
                    const updatedAddresses = [...(selectedClient.shippingAddresses || []), newShippingAddress];
                    await clientsApi.update(selectedClient.id, { shippingAddresses: updatedAddresses });
                } catch (err) {
                    console.error('Failed to update client shipping addresses', err);
                    toast.warning('Failed to save new shipping address to client profile');
                }
            }
        }

        setIsLoading(true);
        try {
            const invoiceData = {
                invoiceNumber: data.invoiceNumber,
                referenceNumber: data.referenceNumber,
                poNumber: data.poNumber,
                poDate: data.poDate,
                ewayNumber: data.ewayNumber,
                clientId: data.clientId,
                date: data.date,
                companyId,
                shippingAddress: shippingAddressMode === 'none' ? null : finalShippingAddress,
                items: totals.items,
                taxableAmount: totals.taxableAmount,
                cgst: totals.cgst,
                sgst: totals.sgst,
                igst: totals.igst,
                totalAmount: totals.totalAmount,
                totalAmountInWords: totals.totalAmountInWords,
                taxBreakdown: totals.taxBreakdown,
                status: 'draft',
                paymentStatus: 'unpaid',
            };

            await onSubmit(invoiceData as any);
            toast.success(invoice ? 'Invoice updated successfully' : 'Invoice created successfully');
        } catch (error: any) {
            console.error('Error saving invoice:', error);
            if (error.response?.status === 409) {
                const detail = error.response?.data?.detail || '';
                if (detail.includes('Serial numbers no longer available')) {
                    toast.error(`Some serial numbers are no longer available. Please refresh and try again.`, { duration: 6000 });
                } else {
                    toast.error(detail || 'Conflict occurred while saving invoice');
                }
            } else {
                const errorMessage = error.response?.data?.detail
                    ? (Array.isArray(error.response.data.detail)
                        ? error.response.data.detail.map((e: any) => e.msg).join(', ')
                        : error.response.data.detail)
                    : 'Failed to save invoice';
                toast.error(errorMessage);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const isFirstTab = activeTab === 'header';
    const isLastTab = activeTab === 'summary';

    return (
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 animate-fade-in">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TabKey)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="header" className="gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Header</span>
                    </TabsTrigger>
                    <TabsTrigger value="items" className="gap-2">
                        <Package className="h-4 w-4" />
                        <span className="hidden sm:inline">Items</span>
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="gap-2">
                        <ClipboardCheck className="h-4 w-4" />
                        <span className="hidden sm:inline">Summary</span>
                    </TabsTrigger>
                </TabsList>

                {/* ============ TAB 1: HEADER ============ */}
                <TabsContent value="header" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Invoice Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <SearchableClientDropdown
                                        clients={clients}
                                        selectedClientId={watch('clientId') || ''}
                                        onClientSelect={(clientId) => setValue('clientId', clientId)}
                                        onClientAdded={(newClient) => {
                                            setValue('clientId', newClient.id);
                                            clearErrors('clientId');
                                            onClientAdded?.(newClient);
                                        }}
                                        label="Client"
                                        required
                                        error={errors.clientId?.message}
                                        companyId={companyId}
                                        placeholder="Search or select client..."
                                    />
                                </div>

                                <div>
                                    <FloatingLabelInput
                                        id="invoiceNumber"
                                        label="Invoice Number"
                                        {...register('invoiceNumber')}
                                        error={errors.invoiceNumber?.message}
                                    />

                                </div>

                                <FloatingLabelInput
                                    id="date"
                                    type="date"
                                    label="Invoice Date *"
                                    {...register('date')}
                                    error={errors.date?.message}
                                />
                            </div>

                            {/* Reference Fields Row */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <FloatingLabelInput
                                    id="poNumber"
                                    label="PO Number"
                                    {...register('poNumber')}
                                />
                                <FloatingLabelInput
                                    id="poDate"
                                    type="date"
                                    label="PO Date"
                                    {...register('poDate')}
                                />
                                <FloatingLabelInput
                                    id="ewayNumber"
                                    label="E-way Number"
                                    {...register('ewayNumber')}
                                />
                                <FloatingLabelInput
                                    id="referenceNumber"
                                    label="Reference"
                                    {...register('referenceNumber')}
                                />
                            </div>

                            {selectedClient && (
                                <ShippingAddressSection
                                    client={selectedClient}
                                    mode={shippingAddressMode}
                                    onModeChange={setShippingAddressMode}
                                    selectedAddressIndex={selectedAddressIndex}
                                    onSelectedAddressChange={setSelectedAddressIndex}
                                    newAddress={newShippingAddress}
                                    onNewAddressChange={setNewShippingAddress}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ TAB 2: ITEMS ============ */}
                <TabsContent value="items" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Invoice Items</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Use FormItemRow for consistent searchable dropdowns with Add New */}
                            <div className="space-y-4">
                                {fields.map((field, index) => (
                                    <FormItemRow
                                        key={field.id}
                                        index={index}
                                        fieldId={field.id}
                                        control={control}
                                        products={localProducts}
                                        companyId={companyId}
                                        watchItem={watchItems?.[index] || {}}
                                        onProductSelect={(idx, productId) => {
                                            handleProductSelect(idx, productId);
                                            setActiveRowIndex(idx);
                                        }}
                                        onQuantityChange={handleQuantityChange}
                                        onRemove={remove}
                                        onOpenSerialManager={setSerialModalIndex}
                                        onProductAdded={(product) => {
                                            setLocalProducts(prev => [...prev, product]);
                                            handleProductSelect(index, product.id);
                                        }}
                                        serialNumbers={serialNumbers[field.id] || []}
                                        serialNumberError={serialNumberErrors[field.id]}
                                        canRemove={fields.length > 1}
                                        error={errors.items?.[index]}
                                        showSerialButton={true}
                                    />
                                ))}
                            </div>

                            <Button type="button" variant="outline" onClick={() => { append({ productId: '' } as any); setActiveRowIndex(fields.length); }} className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Item
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============ TAB 3: SUMMARY ============ */}
                <TabsContent value="summary" className="mt-4 space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Review & Submit</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Header Overview */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-muted-foreground block">Invoice #</span>
                                    <span className="font-semibold">{watch('invoiceNumber')}</span>
                                </div>
                                <div>
                                    <span className="text-muted-foreground block">Date</span>
                                    <span className="font-semibold">{watch('date')}</span>
                                </div>
                                {watch('poNumber') && <div><span className="text-muted-foreground block">PO #</span><span>{watch('poNumber')}</span></div>}
                                {watch('ewayNumber') && <div><span className="text-muted-foreground block">E-way #</span><span>{watch('ewayNumber')}</span></div>}
                            </div>

                            {/* Client Summary */}
                            {selectedClient && (
                                <div className="p-4 bg-muted/30 rounded-lg border border-border/50">
                                    <h4 className="font-semibold mb-2 text-sm flex items-center gap-2"><FileText className="h-3 w-3" /> Client Details</h4>
                                    <p className="text-sm font-medium">{selectedClient.clientName}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{selectedClient.address.city}, {selectedClient.address.state}</p>
                                </div>
                            )}

                            {/* Items Summary Table */}
                            {watchItems && watchItems.length > 0 && (
                                <div className="rounded-md border text-xs">
                                    <div className="grid grid-cols-12 bg-muted/50 p-2 font-medium border-b">
                                        <div className="col-span-1">#</div>
                                        <div className="col-span-5">Item</div>
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

                            {totals && (
                                <TotalsSummary
                                    taxableAmount={totals.taxableAmount}
                                    cgst={totals.cgst}
                                    sgst={totals.sgst}
                                    igst={totals.igst}
                                    totalAmount={totals.totalAmount}
                                    taxBreakdown={totals.taxBreakdown}
                                    isInterState={companyState !== selectedClient?.address?.state}
                                />
                            )}

                            {!totals && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No valid items added yet.</p>
                                    <Button type="button" variant="link" onClick={() => setActiveTab('items')}>Go to Items tab</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Serial Manager Modal */}
            <SerialManager
                open={serialModalIndex !== null}
                onClose={() => setSerialModalIndex(null)}
                productId={serialModalIndex !== null ? watchItems?.[serialModalIndex]?.productId : undefined}
                initialSelected={serialModalIndex !== null ? (fields?.[serialModalIndex]?.id ? (serialNumbers[fields[serialModalIndex].id] || []) : []) : []}
                quantity={serialModalIndex !== null ? Number(watchItems?.[serialModalIndex]?.quantity) || 0 : 0}
                fetchFromDb={true}
                claimFromDb={true}
                onSave={async (selected) => {
                    if (serialModalIndex === null) return;
                    const key = fields?.[serialModalIndex]?.id;
                    if (!key) return;
                    setSerialNumbers((prev) => ({ ...prev, [key]: selected }));
                    const productId = watchItems?.[serialModalIndex]?.productId;
                    if (productId) {
                        try {
                            const fresh = await productsApi.getById(productId);
                            setLocalProducts((prev) => prev.map((p) => (p.id === fresh.id ? fresh : p)));
                        } catch (err) {
                            console.error('Failed to refresh product after claiming serials', err);
                        }
                    }
                }}
            />

            {/* Out of Stock Dialog */}
            {outOfStockData && (
                <OutOfStockDialog
                    isOpen={outOfStockDialogOpen}
                    onClose={() => { setOutOfStockDialogOpen(false); setOutOfStockData(null); }}
                    product={{ ...outOfStockData.product, name: outOfStockData.product.productName }}
                    availableStock={outOfStockData.availableStock}
                    requestedQuantity={outOfStockData.requestedQuantity}
                    onProceedAnyway={handleOutOfStockProceed}
                    isInvoice={true}
                />
            )}

            {/* Navigation Footer */}
            <div className="flex justify-between pt-4 border-t">
                <div>
                    {!isFirstTab && (
                        <Button type="button" variant="outline" onClick={goBack}>Back</Button>
                    )}
                </div>
                <div className="flex gap-3">
                    {onCancel && (
                        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
                    )}
                    {!isLastTab ? (
                        <Button type="button" onClick={goToNext}>Next</Button>
                    ) : (
                        <Button type="submit" disabled={isLoading || !totals} className="bg-gradient-to-r from-primary to-accent text-white shadow-lg">
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {invoice ? 'Update Invoice' : 'Create Invoice'}
                        </Button>
                    )}
                </div>
            </div>
        </form>
    );
}

export default InvoiceForm;
