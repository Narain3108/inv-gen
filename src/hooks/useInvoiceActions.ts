/**
 * useInvoiceActions Hook
 * Extracts all invoice-related action handlers from the Invoices page
 * Following Single Responsibility Principle - handles only invoice actions
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Invoice, Client, Company, Product, PaymentFormData } from '@/types';
import { invoicesApi } from '@/lib/api/invoices.api';
import { productsApi } from '@/lib/api/products.api';
import { clientsApi } from '@/lib/api/clients.api';
import { companiesApi } from '@/lib/api/companies.api';
import { loadCustomization } from '@/lib/services/customization-service';
import { generateInvoicePDF, previewInvoicePDF } from '@/lib/utils/pdf-generator';
import { generateInvoiceNumber } from '@/lib/utils/numbering-utils';
import { amountToWords } from '@/lib/utils/number-to-words';
import { toast } from 'sonner';

interface UseInvoiceActionsConfig {
    selectedCompany: Company | null;
    company: Company | null;
    products: Product[];
    clients: Client[];
    invoices: Invoice[];
    onInvoicesChange: (invoices: Invoice[]) => void;
    onRefreshInvoices: () => Promise<void>;
    onRefreshClients: () => Promise<void>;
    reloadCompanyData: () => Promise<void>;
}

interface DialogState {
    isDialogOpen: boolean;
    editingInvoice: Invoice | undefined;
    deleteInvoice: Invoice | null;
    paymentInvoice: Invoice | null;
    isPaymentDialogOpen: boolean;
    downloadInvoice: Invoice | null;
    isCopyTypeDialogOpen: boolean;
    isCustomizationDialogOpen: boolean;
}

interface UseInvoiceActionsReturn extends DialogState {
    // Dialog controls
    setIsDialogOpen: (open: boolean) => void;
    setIsPaymentDialogOpen: (open: boolean) => void;
    setIsCopyTypeDialogOpen: (open: boolean) => void;
    setIsCustomizationDialogOpen: (open: boolean) => void;
    setDeleteInvoice: (invoice: Invoice | null) => void;

    // Action handlers
    handleAddInvoice: () => Promise<void>;
    handleEditInvoice: (invoice: Invoice) => void;
    handleSubmit: (data: any) => Promise<void>;
    handleDeleteInvoice: () => Promise<void>;
    handleViewInvoice: (invoice: Invoice) => Promise<void>;
    handleDownloadInvoice: (invoice: Invoice) => void;
    handleCopyTypeSelected: (copyType: 'original' | 'duplicate') => Promise<void>;
    handleOpenPaymentDialog: (invoice: Invoice) => void;
    handleRecordPayment: (paymentData: PaymentFormData) => Promise<void>;
}

export function useInvoiceActions({
    selectedCompany,
    company,
    products,
    clients,
    invoices,
    onInvoicesChange,
    onRefreshInvoices,
    onRefreshClients,
    reloadCompanyData,
}: UseInvoiceActionsConfig): UseInvoiceActionsReturn {
    const router = useRouter();

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingInvoice, setEditingInvoice] = useState<Invoice | undefined>();
    const [deleteInvoice, setDeleteInvoice] = useState<Invoice | null>(null);
    const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [downloadInvoice, setDownloadInvoice] = useState<Invoice | null>(null);
    const [isCopyTypeDialogOpen, setIsCopyTypeDialogOpen] = useState(false);
    const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);

    /**
     * Add new invoice - validates prerequisites and opens form
     */
    const handleAddInvoice = useCallback(async () => {
        if (!selectedCompany) {
            toast.error('Please create a company first');
            router.push('/invoices/settings/company');
            return;
        }

        if (products.length === 0) {
            toast.error('Please add products first');
            return;
        }

        if (clients.length === 0) {
            toast.error('Please add clients first');
            return;
        }

        await reloadCompanyData();
        setEditingInvoice(undefined);
        setIsDialogOpen(true);
    }, [selectedCompany, products.length, clients.length, reloadCompanyData, router]);

    /**
     * Edit existing invoice
     */
    const handleEditInvoice = useCallback((invoice: Invoice) => {
        setEditingInvoice(invoice);
        setIsDialogOpen(true);
    }, []);

    /**
     * Submit invoice form - creates or updates invoice
     */
    const handleSubmit = useCallback(async (data: any) => {
        if (!selectedCompany || !company) return;

        try {
            // Auto-generate invoice number if not provided
            let invoiceNumber = data.invoiceNumber?.trim();
            if (!invoiceNumber) {
                try {
                    const { invoice_number } = await invoicesApi.generateNumber(selectedCompany.id);
                    invoiceNumber = invoice_number;
                } catch (e) {
                    console.error("Failed to generate number from backend, falling back to local", e);
                    invoiceNumber = generateInvoiceNumber(company, invoices.length);
                }
            }

            // Clean up invoice items
            const cleanedItems = data.items.map((item: any) => {
                const cleanItem = { ...item };
                if (!cleanItem.itemCode) delete cleanItem.itemCode;
                return cleanItem;
            });

            const invoiceData = {
                ...data,
                invoiceNumber,
                items: cleanedItems,
                companyId: selectedCompany.id,
                date: typeof data.date === 'string' ? data.date : new Date(data.date).toISOString(),
                totalAmountInWords: amountToWords(data.totalAmount),
            };

            if (editingInvoice?.id) {
                // Update existing invoice
                await invoicesApi.partialUpdate(editingInvoice.id, {
                    ...invoiceData,
                    paymentStatus: editingInvoice.paymentStatus || 'pending',
                    amountPaid: editingInvoice.amountPaid || 0,
                    amountPending: editingInvoice.amountPending ?? invoiceData.totalAmount,
                    payments: editingInvoice.payments || [],
                }, editingInvoice.companyId);
                toast.success('Invoice updated successfully');
            } else {
                // Create new invoice
                await invoicesApi.create({
                    ...invoiceData,
                    paymentStatus: 'pending',
                    amountPaid: 0,
                    amountPending: invoiceData.totalAmount,
                    payments: [],
                });

                // Update invoice counter
                if (!data.invoiceNumber?.trim() && company.invoiceNumbering) {
                    const newNextNumber = invoices.length + 2;
                    await companiesApi.update(selectedCompany.id, {
                        invoiceNumbering: { ...company.invoiceNumbering, nextNumber: newNextNumber },
                    });
                }

                // Deduct stock
                for (const item of data.items) {
                    if (item.productId) {
                        const product = products.find(p => p.id === item.productId);
                        if (product?.type === 'product' && typeof product.stock === 'number') {
                            await productsApi.update(item.productId, {
                                stock: Math.max(0, product.stock - item.quantity),
                            });
                        }
                    }
                }

                toast.success('Invoice created and stock updated successfully');
            }

            setIsDialogOpen(false);
            await onRefreshInvoices();
        } catch (error) {
            console.error('Error saving invoice:', error);
            toast.error('Failed to save invoice');
        }
    }, [selectedCompany, company, products, invoices, editingInvoice, onRefreshInvoices]);

    /**
     * Delete invoice
     */
    const handleDeleteInvoice = useCallback(async () => {
        if (!deleteInvoice?.id) return;

        const previousInvoices = [...invoices];
        onInvoicesChange(invoices.filter(i => i.id !== deleteInvoice.id));
        setDeleteInvoice(null);
        toast.success('Invoice deleted successfully');

        try {
            await invoicesApi.delete(deleteInvoice.id, deleteInvoice.companyId);
        } catch (error) {
            console.error('Error deleting invoice:', error);
            toast.error('Failed to delete invoice');
            onInvoicesChange(previousInvoices);
        }
    }, [deleteInvoice, invoices, onInvoicesChange]);

    /**
     * View invoice PDF preview
     */
    const handleViewInvoice = useCallback(async (invoice: Invoice) => {
        const currentCompany = selectedCompany || company;
        if (!currentCompany) return;

        const client = clients.find(c => c.id === invoice.clientId);
        if (!client) {
            toast.error('Client not found for this invoice.');
            return;
        }

        const customization = await loadCustomization(currentCompany.id, 'invoice');
        const pdfData = { invoice, company: currentCompany, client, customization };
        previewInvoicePDF(pdfData as any);
    }, [selectedCompany, company, clients]);

    /**
     * Download invoice - opens copy type dialog
     */
    const handleDownloadInvoice = useCallback((invoice: Invoice) => {
        setDownloadInvoice(invoice);
        setIsCopyTypeDialogOpen(true);
    }, []);

    /**
     * Generate and download PDF after copy type selection
     */
    const handleCopyTypeSelected = useCallback(async (copyType: 'original' | 'duplicate') => {
        if (!downloadInvoice) return;

        const currentCompany = selectedCompany || company;
        if (!currentCompany) {
            toast.error('Company not found.');
            return;
        }

        const client = clients.find(c => c.id === downloadInvoice.clientId);
        if (!client) {
            toast.error('Client not found for this invoice.');
            return;
        }

        const hasImages = !!(currentCompany.logoUrl || currentCompany.signatureUrl);
        toast.loading(hasImages ? 'Converting images for PDF...' : 'Generating PDF...', { id: 'pdf-generation' });

        try {
            const customization = await loadCustomization(currentCompany.id, 'invoice');
            const pdfData = { invoice: downloadInvoice, company: currentCompany, client, customization, copyType };
            await generateInvoicePDF(pdfData as any);
            toast.success('PDF generated successfully!', { id: 'pdf-generation' });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            toast.error(`PDF generation failed: ${errorMessage}`, { id: 'pdf-generation' });
        }

        setDownloadInvoice(null);
    }, [downloadInvoice, selectedCompany, company, clients]);

    /**
     * Open payment dialog
     */
    const handleOpenPaymentDialog = useCallback((invoice: Invoice) => {
        setPaymentInvoice(invoice);
        setIsPaymentDialogOpen(true);
    }, []);

    /**
     * Record payment for invoice
     */
    const handleRecordPayment = useCallback(async (paymentData: PaymentFormData) => {
        if (!paymentInvoice?.id) return;

        try {
            const roundTo2Decimals = (num: number) => Math.round(num * 100) / 100;

            const newPayment = {
                id: `payment_${Date.now()}`,
                amount: roundTo2Decimals(paymentData.amount),
                paymentDate: typeof paymentData.paymentDate === 'string'
                    ? paymentData.paymentDate
                    : new Date(paymentData.paymentDate).toISOString(),
                paymentMode: paymentData.paymentMode,
                referenceNumber: paymentData.referenceNumber || '',
                notes: paymentData.notes || '',
                recordedAt: new Date().toISOString(),
            };

            const currentPayments = paymentInvoice.payments || [];
            const currentAmountPaid = roundTo2Decimals(paymentInvoice.amountPaid || 0);
            const totalAmount = roundTo2Decimals(paymentInvoice.totalAmount);
            const newAmountPaid = roundTo2Decimals(currentAmountPaid + paymentData.amount);
            const newAmountPending = roundTo2Decimals(totalAmount - newAmountPaid);

            let newPaymentStatus: 'pending' | 'partially_paid' | 'paid';
            if (newAmountPending <= 0.01) {
                newPaymentStatus = 'paid';
            } else if (newAmountPaid > 0) {
                newPaymentStatus = 'partially_paid';
            } else {
                newPaymentStatus = 'pending';
            }

            await invoicesApi.partialUpdate(paymentInvoice.id, {
                payments: [...currentPayments, newPayment],
                amountPaid: newAmountPaid,
                amountPending: newAmountPending <= 0.01 ? 0 : Math.max(0, newAmountPending),
                paymentStatus: newPaymentStatus,
            }, paymentInvoice.companyId);

            toast.success('Payment recorded successfully');
            setIsPaymentDialogOpen(false);
            setPaymentInvoice(null);
            await onRefreshInvoices();
        } catch (error) {
            console.error('Error recording payment:', error);
            toast.error('Failed to record payment');
        }
    }, [paymentInvoice, onRefreshInvoices]);

    return {
        // Dialog state
        isDialogOpen,
        editingInvoice,
        deleteInvoice,
        paymentInvoice,
        isPaymentDialogOpen,
        downloadInvoice,
        isCopyTypeDialogOpen,
        isCustomizationDialogOpen,

        // Dialog controls
        setIsDialogOpen,
        setIsPaymentDialogOpen,
        setIsCopyTypeDialogOpen,
        setIsCustomizationDialogOpen,
        setDeleteInvoice,

        // Action handlers
        handleAddInvoice,
        handleEditInvoice,
        handleSubmit,
        handleDeleteInvoice,
        handleViewInvoice,
        handleDownloadInvoice,
        handleCopyTypeSelected,
        handleOpenPaymentDialog,
        handleRecordPayment,
    };
}

export default useInvoiceActions;
