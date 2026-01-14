/**
 * useQuotationActions Hook
 * Extracts all quotation-related action handlers from the Quotations page
 * Following Single Responsibility Principle
 * Uses React Query mutations for cache consistency
 */

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Quotation, Client, Company, Product, QuotationStatus } from '@/types';
import { quotationsApi } from '@/lib/api/quotations.api';
import { invoicesApi } from '@/lib/api/invoices.api';
import { companiesApi } from '@/lib/api/companies.api';
import {
    useCreateQuotationMutation,
    useUpdateQuotationMutation,
    useDeleteQuotationMutation,
    useCreateInvoiceMutation,
    useUpdateCompanyMutation
} from '@/hooks/queries';
import { loadCustomization } from '@/lib/services/customization-service';
import { generateQuotationPDF, previewQuotationPDF } from '@/lib/utils/pdf-generator';
import { generateQuotationNumber, generateInvoiceNumber } from '@/lib/utils/numbering-utils';
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

    // React Query mutations
    const createQuotationMutation = useCreateQuotationMutation();
    const updateQuotationMutation = useUpdateQuotationMutation();
    const deleteQuotationMutation = useDeleteQuotationMutation();
    const createInvoiceMutation = useCreateInvoiceMutation();
    const updateCompanyMutation = useUpdateCompanyMutation();

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
     * Submit quotation form - uses React Query mutations
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
                await updateQuotationMutation.mutateAsync({
                    id: editingQuotation.id,
                    data: quotationData,
                });
                // Toast handled by mutation
            } else {
                await createQuotationMutation.mutateAsync(quotationData as any);

                if (!data.quotationNumber?.trim() && company.quotationNumbering) {
                    const newNextNumber = quotations.length + 2;
                    await updateCompanyMutation.mutateAsync({
                        id: selectedCompany.id,
                        data: {
                            quotationNumbering: { ...company.quotationNumbering, nextNumber: newNextNumber },
                        },
                    });
                }
                // Toast handled by mutation
            }

            setIsDialogOpen(false);
            setEditingQuotation(undefined);
            // Cache update handled by mutation
        } catch (error) {
            console.error('Error saving quotation:', error);
            // Error toast handled by mutation
        }
    }, [selectedCompany, company, quotations, editingQuotation, createQuotationMutation, updateQuotationMutation, updateCompanyMutation]);

    /**
     * Delete quotation - uses React Query mutation with optimistic update
     */
    const handleDeleteQuotation = useCallback(async () => {
        if (!deleteQuotation) return;

        setDeleteQuotation(null);

        try {
            await deleteQuotationMutation.mutateAsync({
                id: deleteQuotation.id,
                companyId: deleteQuotation.companyId,
            });
            // Toast and cache update handled by mutation
        } catch (error) {
            console.error('Error deleting quotation:', error);
            // Error toast handled by mutation
        }
    }, [deleteQuotation, deleteQuotationMutation]);

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

            // Count-based numbering: Get total invoices and use count + 1 as next number
            let suggestedNumber = '';
            try {
                // Fetch invoices to count them (using a high limit to get all)
                const allInvoices = await invoicesApi.getAll({
                    company_id: selectedCompany.id,
                    limit: 100
                });

                const totalCount = allInvoices.length;
                const nextSequence = totalCount + 1;

                // Generate formatted number using company config
                // We pass totalCount to get count + 1 as the sequence
                // Override nextNumber in config to ensure our calculated sequence is used
                const tempCompany = {
                    ...currentCompany,
                    invoiceNumbering: {
                        ...currentCompany.invoiceNumbering,
                        nextNumber: nextSequence  // Force our calculated sequence
                    }
                };
                suggestedNumber = generateInvoiceNumber(tempCompany as Company, 0); // count 0 forces use of nextNumber

                console.log('📊 Count-based numbering:', { totalCount, nextSequence, suggestedNumber });
            } catch (e) {
                console.error("Failed to count invoices:", e);
                // Fallback to backend generated number
                try {
                    const { invoice_number } = await invoicesApi.generateNumber(selectedCompany.id);
                    suggestedNumber = invoice_number;
                } catch (fallbackError) {
                    console.error("Fallback number generation also failed:", fallbackError);
                    suggestedNumber = '';
                }
            }

            setInvoiceNumber(suggestedNumber);

        } catch (e) {
            console.error("Failed to prepare conversion", e);
            toast.error("Failed to prepare conversion");
        }

        setConvertingQuotation(quotation);
    }, [selectedCompany, setCompany, setSelectedCompany]);

    /**
     * Confirm convert to invoice
     */
    /**
     * Confirm convert to invoice - uses React Query mutations
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

            const newInvoice = await createInvoiceMutation.mutateAsync(invoiceData as any);

            // Update company invoice numbering counter
            if (selectedCompany.invoiceNumbering) {
                try {
                    const match = invoiceNumber.trim().match(/(\d+)$/);
                    let newNextNumber = (selectedCompany.invoiceNumbering.nextNumber || 1) + 1;

                    if (match) {
                        const currentNum = parseInt(match[0], 10);
                        if (!isNaN(currentNum)) {
                            newNextNumber = currentNum + 1;
                        }
                    }

                    await updateCompanyMutation.mutateAsync({
                        id: selectedCompany.id,
                        data: {
                            invoiceNumbering: { ...selectedCompany.invoiceNumbering, nextNumber: newNextNumber },
                        },
                    });
                } catch (err) {
                    console.error("Failed to update invoice numbering:", err);
                }
            }

            await updateQuotationMutation.mutateAsync({
                id: convertingQuotation.id,
                data: {
                    status: 'converted' as QuotationStatus,
                    convertedToInvoiceId: newInvoice.id,
                },
            });

            toast.success('Quotation converted to invoice successfully');
            setConvertingQuotation(null);
            setInvoiceNumber('');
            router.push('/invoices/invoices');
        } catch (error) {
            console.error('Error converting quotation:', error);
            toast.error('Failed to convert quotation to invoice');
        }
    }, [convertingQuotation, invoiceNumber, selectedCompany, router, createInvoiceMutation, updateQuotationMutation, updateCompanyMutation]);

    /**
     * Update quotation status - uses React Query mutation
     */
    const handleUpdateStatus = useCallback(async (quotation: Quotation, status: QuotationStatus) => {
        try {
            let validStatus = status === 'pending' ? 'draft' : status;
            if (validStatus === 'converted') {
                toast.error('Use "Convert to Invoice" to change status to converted');
                return;
            }
            await updateQuotationMutation.mutateAsync({
                id: quotation.id,
                data: { status: validStatus as any },
            });
            toast.success(`Quotation marked as ${status}`);
            // Cache update handled by mutation
        } catch (error) {
            console.error('Error updating quotation status:', error);
            toast.error('Failed to update quotation status');
        }
    }, [updateQuotationMutation]);

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
