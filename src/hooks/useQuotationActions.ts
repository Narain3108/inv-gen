/**
 * useQuotationActions Hook
 * Extracts all quotation-related action handlers from the Quotations page
 * Following Single Responsibility Principle
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Quotation, Client, Company, Product, QuotationStatus } from '@/types';
import { quotationsApi } from '@/lib/api/quotations.api';
import { invoicesApi } from '@/lib/api/invoices.api';
import { companiesApi } from '@/lib/api/companies.api';
import { loadCustomization } from '@/lib/services/customization-service';
import { generateQuotationPDF, previewQuotationPDF } from '@/lib/utils/pdf-generator';
import { generateQuotationNumber } from '@/lib/utils/numbering-utils';
import { amountToWords } from '@/lib/utils/number-to-words';
import { toast } from 'sonner';

interface UseQuotationActionsConfig {
    selectedCompany: Company | null;
    company: Company | undefined;
    products: Product[];
    clients: Client[];
    quotations: Quotation[];
    onQuotationsChange: (quotations: Quotation[]) => void;
    onRefreshData: () => Promise<void>;
    reloadCompanyData: () => Promise<void>;
    setCompany: (company: Company) => void;
    setSelectedCompany: (company: Company) => void;
}

interface DialogState {
    isDialogOpen: boolean;
    editingQuotation: Quotation | undefined;
    deleteQuotation: Quotation | null;
    convertingQuotation: Quotation | null;
    invoiceNumber: string;
    isCustomizationDialogOpen: boolean;
}

interface UseQuotationActionsReturn extends DialogState {
    // Dialog controls
    setIsDialogOpen: (open: boolean) => void;
    setDeleteQuotation: (quotation: Quotation | null) => void;
    setConvertingQuotation: (quotation: Quotation | null) => void;
    setInvoiceNumber: (number: string) => void;
    setIsCustomizationDialogOpen: (open: boolean) => void;

    // Action handlers
    handleAddQuotation: () => Promise<void>;
    handleEditQuotation: (quotation: Quotation) => void;
    handleSubmit: (data: any) => Promise<void>;
    handleDeleteQuotation: () => Promise<void>;
    handleViewQuotation: (quotation: Quotation) => Promise<void>;
    handleDownloadQuotation: (quotation: Quotation) => Promise<void>;
    handleConvertToInvoice: (quotation: Quotation) => Promise<void>;
    confirmConvertToInvoice: () => Promise<void>;
    handleUpdateStatus: (quotation: Quotation, status: QuotationStatus) => Promise<void>;
}

export function useQuotationActions({
    selectedCompany,
    company,
    products,
    clients,
    quotations,
    onQuotationsChange,
    onRefreshData,
    reloadCompanyData,
    setCompany,
    setSelectedCompany,
}: UseQuotationActionsConfig): UseQuotationActionsReturn {
    const router = useRouter();

    // Dialog state
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingQuotation, setEditingQuotation] = useState<Quotation | undefined>();
    const [deleteQuotation, setDeleteQuotation] = useState<Quotation | null>(null);
    const [convertingQuotation, setConvertingQuotation] = useState<Quotation | null>(null);
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [isCustomizationDialogOpen, setIsCustomizationDialogOpen] = useState(false);

    /**
     * Add new quotation
     */
    const handleAddQuotation = useCallback(async () => {
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
        setEditingQuotation(undefined);
        setIsDialogOpen(true);
    }, [selectedCompany, products.length, clients.length, reloadCompanyData, router]);

    /**
     * Edit existing quotation
     */
    const handleEditQuotation = useCallback((quotation: Quotation) => {
        setEditingQuotation(quotation);
        setIsDialogOpen(true);
    }, []);

    /**
     * Submit quotation form
     */
    const handleSubmit = useCallback(async (data: any) => {
        if (!selectedCompany || !company) return;

        try {
            let quotationNumber = data.quotationNumber?.trim();
            if (!quotationNumber) {
                quotationNumber = generateQuotationNumber(company, quotations.length);
            }

            const cleanedItems = data.items.map((item: any) => {
                const cleanItem = { ...item };
                if (!cleanItem.itemCode) delete cleanItem.itemCode;
                return cleanItem;
            });

            const quotationData = {
                ...data,
                items: cleanedItems,
                quotationNumber,
                companyId: selectedCompany.id,
                company_id: selectedCompany.id,
                status: editingQuotation?.status || 'pending' as QuotationStatus,
                date: new Date(data.date).toISOString(),
                validUntil: new Date(data.validUntil).toISOString(),
                totalAmountInWords: amountToWords(data.totalAmount),
            };

            if (editingQuotation?.id) {
                await quotationsApi.update(editingQuotation.id, quotationData);
                toast.success('Quotation updated successfully');
            } else {
                await quotationsApi.create(quotationData);

                if (!data.quotationNumber?.trim() && company.quotationNumbering) {
                    const newNextNumber = quotations.length + 2;
                    await companiesApi.update(selectedCompany.id, {
                        quotationNumbering: { ...company.quotationNumbering, nextNumber: newNextNumber },
                    });
                }

                toast.success('Quotation created successfully');
            }

            setIsDialogOpen(false);
            setEditingQuotation(undefined);
            await onRefreshData();
        } catch (error) {
            console.error('Error saving quotation:', error);
            toast.error('Failed to save quotation');
        }
    }, [selectedCompany, company, quotations, editingQuotation, onRefreshData]);

    /**
     * Delete quotation
     */
    const handleDeleteQuotation = useCallback(async () => {
        if (!deleteQuotation) return;

        const previousQuotations = [...quotations];
        onQuotationsChange(quotations.filter(q => q.id !== deleteQuotation.id));
        setDeleteQuotation(null);
        toast.success('Quotation deleted successfully');

        try {
            await quotationsApi.delete(deleteQuotation.id, deleteQuotation.companyId);
        } catch (error) {
            console.error('Error deleting quotation:', error);
            toast.error('Failed to delete quotation');
            onQuotationsChange(previousQuotations);
        }
    }, [deleteQuotation, quotations, onQuotationsChange]);

    /**
     * View quotation PDF preview
     */
    const handleViewQuotation = useCallback(async (quotation: Quotation) => {
        const currentCompany = selectedCompany || company;
        if (!currentCompany) return;

        const client = clients.find(c => c.id === quotation.clientId);
        if (client) {
            const customization = await loadCustomization(currentCompany.id, 'quotation');
            await previewQuotationPDF({ quotation, company: currentCompany, client, customization });
        }
    }, [selectedCompany, company, clients]);

    /**
     * Download quotation PDF
     */
    const handleDownloadQuotation = useCallback(async (quotation: Quotation) => {
        const currentCompany = selectedCompany || company;
        if (!currentCompany) return;

        const client = clients.find(c => c.id === quotation.clientId);
        if (client) {
            const customization = await loadCustomization(currentCompany.id, 'quotation');
            await generateQuotationPDF({ quotation, company: currentCompany, client, customization });
        }
    }, [selectedCompany, company, clients]);

    /**
     * Start convert to invoice flow
     */
    const handleConvertToInvoice = useCallback(async (quotation: Quotation) => {
        if (!selectedCompany) return;

        try {
            const currentCompany = await companiesApi.getById(selectedCompany.id);
            setCompany(currentCompany);
            setSelectedCompany(currentCompany);
        } catch (e) {
            console.error("Failed to reload company data", e);
        }

        try {
            const { invoice_number } = await invoicesApi.generateNumber(selectedCompany.id);
            setInvoiceNumber(invoice_number);
        } catch (e) {
            console.error("Failed to generate invoice number", e);
            toast.error("Failed to generate invoice number");
        }

        setConvertingQuotation(quotation);
    }, [selectedCompany, setCompany, setSelectedCompany]);

    /**
     * Confirm convert to invoice
     */
    const confirmConvertToInvoice = useCallback(async () => {
        if (!convertingQuotation || !invoiceNumber.trim() || !selectedCompany) {
            toast.error('Please provide an invoice number');
            return;
        }

        try {
            const existingInvoices = await invoicesApi.getAll({
                company_id: selectedCompany.id,
                invoiceNumber: invoiceNumber.trim()
            });

            if (existingInvoices.length > 0) {
                toast.error('Invoice number already exists');
                return;
            }

            const invoiceData = {
                invoiceNumber: invoiceNumber.trim(),
                referenceNumber: convertingQuotation.quotationNumber,
                companyId: convertingQuotation.companyId,
                company_id: convertingQuotation.companyId,
                clientId: convertingQuotation.clientId,
                client_id: convertingQuotation.clientId,
                date: new Date().toISOString(),
                items: convertingQuotation.items,
                totalAmount: convertingQuotation.totalAmount,
                totalAmountInWords: convertingQuotation.totalAmountInWords,
                taxableAmount: convertingQuotation.taxableAmount,
                cgst: convertingQuotation.cgst,
                sgst: convertingQuotation.sgst,
                igst: convertingQuotation.igst,
                taxBreakdown: convertingQuotation.taxBreakdown || undefined,
                paymentStatus: 'pending' as const,
                amountPaid: 0,
                amountPending: convertingQuotation.totalAmount,
                payments: [],
            };

            const newInvoice = await invoicesApi.create(invoiceData);

            await quotationsApi.partialUpdate(convertingQuotation.id, {
                status: 'converted' as QuotationStatus,
                convertedToInvoiceId: newInvoice.id,
            }, convertingQuotation.companyId);

            toast.success('Quotation converted to invoice successfully');
            setConvertingQuotation(null);
            setInvoiceNumber('');
            await onRefreshData();
            router.push('/invoices/invoices');
        } catch (error) {
            console.error('Error converting quotation:', error);
            toast.error('Failed to convert quotation to invoice');
        }
    }, [convertingQuotation, invoiceNumber, selectedCompany, onRefreshData, router]);

    /**
     * Update quotation status
     */
    const handleUpdateStatus = useCallback(async (quotation: Quotation, status: QuotationStatus) => {
        try {
            let validStatus = status === 'pending' ? 'draft' : status;
            if (validStatus === 'converted') {
                toast.error('Use "Convert to Invoice" to change status to converted');
                return;
            }
            await quotationsApi.updateStatus(quotation.id, validStatus as any, quotation.companyId);
            toast.success(`Quotation marked as ${status}`);
            await onRefreshData();
        } catch (error) {
            console.error('Error updating quotation status:', error);
            toast.error('Failed to update quotation status');
        }
    }, [onRefreshData]);

    return {
        // Dialog state
        isDialogOpen,
        editingQuotation,
        deleteQuotation,
        convertingQuotation,
        invoiceNumber,
        isCustomizationDialogOpen,

        // Dialog controls
        setIsDialogOpen,
        setDeleteQuotation,
        setConvertingQuotation,
        setInvoiceNumber,
        setIsCustomizationDialogOpen,

        // Action handlers
        handleAddQuotation,
        handleEditQuotation,
        handleSubmit,
        handleDeleteQuotation,
        handleViewQuotation,
        handleDownloadQuotation,
        handleConvertToInvoice,
        confirmConvertToInvoice,
        handleUpdateStatus,
    };
}

export default useQuotationActions;
