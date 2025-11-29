/**
 * PDF Address Section Builder
 */

import { Client, Invoice, Quotation } from '@/types';
import { InvoiceCustomization } from '@/types/customization';

/**
 * Build billing and shipping address section
 */
export const buildAddressSection = (client: Client, customization?: InvoiceCustomization, document?: Invoice | Quotation): any => {
  const showBilling = customization?.addresses?.showBillingAddress !== false;
  const showShipping = customization?.addresses?.showShippingAddress !== false;
  const showGSTIN = customization?.addresses?.showGSTIN !== false;
  const showPhone = customization?.addresses?.showPhone !== false;
  const showEmail = customization?.addresses?.showEmail !== false;

  const billingLabel = customization?.addresses?.billingLabel || 'BILLING ADDRESS';
  const shippingLabel = customization?.addresses?.shippingLabel || 'SHIPPING ADDRESS';

  // Use shipping address from document if available, otherwise fallback to client's shipping address, then client's main address
  const shippingAddress = document?.shippingAddress || client.shippingAddress || client.address;
  const billingAddress = client.billingAddress || client.address;

  return {
    columns: [
      // Billing Address
      ...(showBilling ? [{
        width: '48%',
        stack: [
          {
            text: billingLabel,
            fontSize: 9,
            bold: true,
            color: '#1f2937',
            margin: [0, 0, 0, 8]
          },
          {
            text: client.clientName,
            fontSize: 11,
            bold: true,
            margin: [0, 0, 0, 4]
          },
          {
            text: billingAddress.street,
            fontSize: 9,
            margin: [0, 0, 0, 2]
          },
          {
            text: `${billingAddress.city}, ${billingAddress.state} - ${billingAddress.pincode}`,
            fontSize: 9,
            margin: [0, 0, 0, 3]
          },
          ...(showGSTIN && client.gstin ? [{
            text: `GSTIN: ${client.gstin}`,
            fontSize: 9,
            margin: [0, 0, 0, 2],
          }] : []),
          ...(showPhone ? [{
            text: `Phone: ${client.contact.phone}`,
            fontSize: 9,
            margin: [0, 0, 0, 2]
          }] : []),
          ...(showEmail && client.contact?.email ? [{
            text: `Email: ${client.contact.email}`,
            fontSize: 9,
            margin: [0, 0, 0, 2]
          }] : []),
          {
            text: `Place of Supply: ${billingAddress.state}`,
            fontSize: 9,
            margin: [0, 3, 0, 0],
            bold: true,
            color: '#059669'
          },
        ],
      }] : []),
      ...(showBilling && showShipping ? [{ width: '4%', text: '' }] : []), // Spacer
      // Shipping Address
      ...(showShipping ? [{
        width: '48%',
        stack: [
          {
            text: shippingLabel,
            fontSize: 9,
            bold: true,
            color: '#1f2937',
            margin: [0, 0, 0, 8]
          },
          {
            text: client.clientName,
            fontSize: 11,
            bold: true,
            margin: [0, 0, 0, 4]
          },
          {
            text: shippingAddress.street,
            fontSize: 9,
            margin: [0, 0, 0, 2]
          },
          {
            text: `${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`,
            fontSize: 9,
            margin: [0, 0, 0, 3]
          },
          ...(showGSTIN && client.gstin ? [{
            text: `GSTIN: ${client.gstin}`,
            fontSize: 9,
            margin: [0, 0, 0, 2],
          }] : []),
          ...(showPhone ? [{
            text: `Phone: ${client.contact.phone}`,
            fontSize: 9,
            margin: [0, 0, 0, 2]
          }] : []),
          ...(showEmail && client.contact?.email ? [{
            text: `Email: ${client.contact.email}`,
            fontSize: 9,
            margin: [0, 0, 0, 2]
          }] : []),
          {
            text: `Place of Supply: ${shippingAddress.state}`,
            fontSize: 9,
            margin: [0, 3, 0, 0],
            bold: true,
            color: '#059669'
          },
        ],
      }] : []),
    ],
    margin: [0, 0, 0, 20],
  };
};
