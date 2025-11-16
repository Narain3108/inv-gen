/**
 * PDF Address Section Builder
 */

import { Client } from '@/types';
import { InvoiceCustomization } from '@/types/customization';

/**
 * Build billing and shipping address section
 */
export const buildAddressSection = (client: Client, customization?: InvoiceCustomization): any => {
  const showBilling = customization?.addresses?.showBillingAddress !== false;
  const showShipping = customization?.addresses?.showShippingAddress !== false;
  const showGSTIN = customization?.addresses?.showGSTIN !== false;
  const showPhone = customization?.addresses?.showPhone !== false;
  const showEmail = customization?.addresses?.showEmail !== false;

  const billingLabel = customization?.addresses?.billingLabel || 'BILLING ADDRESS';
  const shippingLabel = customization?.addresses?.shippingLabel || 'SHIPPING ADDRESS';

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
            text: client.billingAddress?.street || client.address.street,
            fontSize: 9,
            margin: [0, 0, 0, 2]
          },
          {
            text: client.billingAddress
              ? `${client.billingAddress.city}, ${client.billingAddress.state} - ${client.billingAddress.pincode}`
              : `${client.address.city}, ${client.address.state} - ${client.address.pincode}`,
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
            text: `Place of Supply: ${client.billingAddress?.state || client.address.state}`,
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
            text: client.shippingAddress?.street || client.address.street,
            fontSize: 9,
            margin: [0, 0, 0, 2]
          },
          {
            text: client.shippingAddress
              ? `${client.shippingAddress.city}, ${client.shippingAddress.state} - ${client.shippingAddress.pincode}`
              : `${client.address.city}, ${client.address.state} - ${client.address.pincode}`,
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
            text: `Place of Supply: ${client.shippingAddress?.state || client.address.state}`,
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
