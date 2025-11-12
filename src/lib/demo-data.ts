/**
 * Demo/Seed Data Generator
 * Create sample data for testing
 */

import { Timestamp } from 'firebase/firestore';
import { Company, Product, Client, Invoice } from '@/types';

/**
 * Generate demo company data
 */
export const generateDemoCompany = (userId: string): Omit<Company, 'id'> => ({
  userId,
  name: 'TechVista Solutions Pvt Ltd',
  gstin: '29AABCT1332L1Z4',
  state: 'Karnataka',
  address: {
    street: '123, MG Road, Ashok Nagar',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560001',
    country: 'India',
  },
  contact: {
    phone: '+91 80 1234 5678',
    email: 'info@techvista.com',
    website: 'https://www.techvista.com',
  },
  bankDetails: {
    bankName: 'HDFC Bank',
    accountNumber: '50200012345678',
    ifscCode: 'HDFC0001234',
    accountHolderName: 'TechVista Solutions Pvt Ltd',
    branch: 'MG Road Branch',
    upiId: 'techvista@hdfcbank',
  },
  logoUrl: 'https://drive.google.com/uc?id=1234567890',
  pan: 'AABCT1332L',
  website: 'https://www.techvista.com',
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
});

/**
 * Generate demo products
 */
export const generateDemoProducts = (userId: string, companyId: string): Omit<Product, 'id'>[] => [
  {
    userId,
    companyId,
    productName: 'Web Development Service',
    description: 'Custom website development with modern technologies',
    hsn: '998314',
    unit: 'Hrs',
    price: 2500,
    gstRate: 18,
    cessRate: 0,
    type: 'service',
    createdAt: Timestamp.now(),
  },
  {
    userId,
    companyId,
    productName: 'Mobile App Development',
    description: 'iOS and Android app development',
    hsn: '998314',
    unit: 'Hrs',
    price: 3000,
    gstRate: 18,
    cessRate: 0,
    type: 'service',
    createdAt: Timestamp.now(),
  },
  {
    userId,
    companyId,
    productName: 'UI/UX Design',
    description: 'User interface and experience design services',
    hsn: '998313',
    unit: 'Hrs',
    price: 2000,
    gstRate: 18,
    cessRate: 0,
    type: 'service',
    createdAt: Timestamp.now(),
  },
  {
    userId,
    companyId,
    productName: 'Cloud Hosting Package',
    description: 'Annual cloud hosting and maintenance',
    hsn: '998314',
    unit: 'Nos',
    price: 15000,
    gstRate: 18,
    cessRate: 0,
    stock: 100,
    type: 'service',
    createdAt: Timestamp.now(),
  },
  {
    userId,
    companyId,
    productName: 'SEO Optimization',
    description: 'Search engine optimization services',
    hsn: '998313',
    unit: 'Hrs',
    price: 1800,
    gstRate: 18,
    cessRate: 0,
    type: 'service',
    createdAt: Timestamp.now(),
  },
];

/**
 * Generate demo clients
 */
export const generateDemoClients = (userId: string, companyId: string): Omit<Client, 'id'>[] => [
  {
    userId,
    companyId,
    clientName: 'Acme Corporation',
    gstin: '29AAECA1234A1Z5',
    address: {
      street: '45, Brigade Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560025',
      country: 'India',
    },
    contact: {
      phone: '+91 80 9876 5432',
      email: 'contact@acmecorp.com',
      website: 'https://www.acmecorp.com',
    },
    pan: 'AAECA1234A',
    createdAt: Timestamp.now(),
  },
  {
    userId,
    companyId,
    clientName: 'GlobalTech Industries',
    gstin: '27AABCG5678M1Z1',
    address: {
      street: '789, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400069',
      country: 'India',
    },
    contact: {
      phone: '+91 22 1234 5678',
      email: 'info@globaltech.com',
      website: 'https://www.globaltech.com',
    },
    pan: 'AABCG5678M',
    createdAt: Timestamp.now(),
  },
  {
    userId,
    companyId,
    clientName: 'StartupHub Ventures',
    gstin: '29AADCS9012P1ZX',
    address: {
      street: '12, Koramangala 5th Block',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560095',
      country: 'India',
    },
    contact: {
      phone: '+91 80 5555 6666',
      email: 'hello@startuphub.in',
      website: 'https://www.startuphub.in',
    },
    pan: 'AADCS9012P',
    createdAt: Timestamp.now(),
  },
  {
    userId,
    companyId,
    clientName: 'E-Commerce Solutions Ltd',
    gstin: '07AAHCE2233R1Z2',
    address: {
      street: '56, Connaught Place',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110001',
      country: 'India',
    },
    contact: {
      phone: '+91 11 9988 7766',
      email: 'sales@ecomsolutions.com',
      website: 'https://www.ecomsolutions.com',
    },
    pan: 'AAHCE2233R',
    createdAt: Timestamp.now(),
  },
  {
    userId,
    companyId,
    clientName: 'Digital Marketing Pro',
    gstin: '29AAFCD4567K1ZB',
    address: {
      street: '78, Indiranagar',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      country: 'India',
    },
    contact: {
      phone: '+91 80 4444 3333',
      email: 'contact@digitalmarketingpro.com',
    },
    pan: 'AAFCD4567K',
    createdAt: Timestamp.now(),
  },
];

/**
 * Generate demo invoice number
 */
export const generateInvoiceNumber = (index: number): string => {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  return `INV/${year}/${String(month).padStart(2, '0')}/${String(index + 1).padStart(4, '0')}`;
};

/**
 * Calculate tax for invoice item
 */
const calculateItemTax = (
  quantity: number,
  unitPrice: number,
  discount: number,
  gstRate: number,
  isInterState: boolean,
  cessRate: number = 0
) => {
  const amount = quantity * unitPrice;
  const discountAmount = (amount * discount) / 100;
  const taxableAmount = amount - discountAmount;
  const gstAmount = (taxableAmount * gstRate) / 100;
  const cessAmount = cessRate > 0 ? (taxableAmount * cessRate) / 100 : 0;

  if (isInterState) {
    return {
      taxableAmount,
      cgst: 0,
      sgst: 0,
      igst: gstAmount,
      cess: cessAmount,
      lineTotal: taxableAmount + gstAmount + cessAmount,
    };
  } else {
    return {
      taxableAmount,
      cgst: gstAmount / 2,
      sgst: gstAmount / 2,
      igst: 0,
      cess: cessAmount,
      lineTotal: taxableAmount + gstAmount + cessAmount,
    };
  }
};

/**
 * Generate demo invoices
 */
export const generateDemoInvoices = (
  userId: string,
  companyId: string,
  companyState: string,
  products: Product[],
  clients: Client[]
): Omit<Invoice, 'id'>[] => {
  const invoices: Omit<Invoice, 'id'>[] = [];
  const statuses: Array<'paid' | 'unpaid' | 'partially_paid' | 'overdue'> = [
    'paid',
    'paid',
    'paid',
    'unpaid',
    'partially_paid',
  ];

  clients.forEach((client) => {
    const numInvoices = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numInvoices; i++) {
      const invoiceDate = new Date();
      invoiceDate.setDate(invoiceDate.getDate() - Math.floor(Math.random() * 90));
      
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);

      const isInterState = client.address.state !== companyState;
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProducts = products
        .sort(() => 0.5 - Math.random())
        .slice(0, numItems);

      const items = selectedProducts.map((product) => {
        const quantity = Math.floor(Math.random() * 10) + 1;
        const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 10) : 0;
        const taxes = calculateItemTax(
          quantity,
          product.price,
          discount,
          product.gstRate,
          isInterState,
          product.cessRate
        );

        return {
          productId: product.id,
          description: product.productName,
          hsn: product.hsn,
          quantity,
          unit: product.unit,
          unitPrice: product.price,
          discount,
          gstRate: product.gstRate,
          cessRate: product.cessRate,
          ...taxes,
        };
      });

      const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
      const cgst = items.reduce((sum, item) => sum + item.cgst, 0);
      const sgst = items.reduce((sum, item) => sum + item.sgst, 0);
      const igst = items.reduce((sum, item) => sum + item.igst, 0);
      const cess = items.reduce((sum, item) => sum + (item.cess || 0), 0);
      const taxableAmount = items.reduce((sum, item) => sum + item.taxableAmount, 0);
      const totalAmount = items.reduce((sum, item) => sum + item.lineTotal, 0);

      invoices.push({
        userId,
        companyId,
        clientId: client.id!,
        invoiceNumber: generateInvoiceNumber(invoices.length),
        date: Timestamp.fromDate(invoiceDate),
        items,
        taxableAmount,
        cgst,
        sgst,
        igst,
        totalAmount: Math.round(totalAmount),
        totalAmountInWords: '',
        notes: 'Thank you for your business!',
        createdAt: Timestamp.fromDate(invoiceDate),
        updatedAt: Timestamp.fromDate(invoiceDate),
      });
    }
  });

  return invoices;
};
