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

  // If the document explicitly sets `shippingAddress` to null, treat that as an
  // explicit opt-out: do not include a shipping address in the PDF. Otherwise,
  // prefer document.shippingAddress when provided, then fall back to client's
  // saved shippingAddress or main address.
  let shippingAddress: any = undefined;
  if (document && Object.prototype.hasOwnProperty.call(document, 'shippingAddress')) {
    if (document.shippingAddress === null) {
      // explicit opt-out: leave shippingAddress undefined and the builder
      // will skip rendering the shipping block (handled below via showShipping)
      shippingAddress = undefined;
    } else if (document.shippingAddress) {
      shippingAddress = document.shippingAddress;
    } else {
      // property exists but undefined-ish: fall back to client addresses
      shippingAddress = client.shippingAddress || client.address;
    }
  } else {
    shippingAddress = client.shippingAddress || client.address;
  }
  const billingAddress = client.billingAddress || client.address;

  // Layout: billing on left, flexible spacer, shipping on right (right-aligned)
  const columns: any[] = [];

  // If document explicitly opted out (shippingAddress === null), we should
  // avoid rendering shipping-related UI/spacing as well.
  const documentOptedOutShipping = document && Object.prototype.hasOwnProperty.call(document, 'shippingAddress') && document.shippingAddress === null;

  if (showBilling) {
    columns.push({
      width: '45%',
      stack: [
        // Title highlighted with light background
        {
          table: {
            widths: ['*'],
            body: [[{ text: billingLabel.toUpperCase(), fontSize: 8, bold: true, fillColor: '#f3f4f6', margin: [4, 2, 4, 2] }]]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 4]
        },
        { text: client.clientName, fontSize: 9, bold: true, margin: [0, 0, 0, 2] },
        { text: billingAddress.street, fontSize: 8, margin: [0, 0, 0, 1] },
        { text: `${billingAddress.city}, ${billingAddress.state} - ${billingAddress.pincode}`, fontSize: 8, margin: [0, 0, 0, 2] },
        ...(showGSTIN && client.gstin ? [{ text: `GSTIN: ${client.gstin}`, fontSize: 8, margin: [0, 0, 0, 1] }] : []),
        ...(showPhone ? [{ text: `Phone: ${client.contact.phone}`, fontSize: 8, margin: [0, 0, 0, 1] }] : []),
        ...(showEmail && client.contact?.email ? [{ text: `Email: ${client.contact.email}`, fontSize: 8, margin: [0, 0, 0, 1] }] : []),
        { text: `Place of Supply: ${billingAddress.state}`, fontSize: 8, margin: [0, 2, 0, 0], bold: true, color: '#059669' },
      ],
    });
  }

  // Flexible spacer to push shipping block to the right-most edge
  if (showBilling && showShipping && !documentOptedOutShipping) {
    columns.push({ width: '*', text: '' });
  }

  if (showShipping && !documentOptedOutShipping) {
    columns.push({
      width: '45%',
      stack: [
        // Title highlighted with light background and right aligned
        {
          table: {
            widths: ['*'],
            body: [[{ text: shippingLabel.toUpperCase(), fontSize: 8, bold: true, fillColor: '#f3f4f6', margin: [4, 2, 4, 2], alignment: 'right' }]]
          },
          layout: 'noBorders',
          margin: [0, 0, 0, 4]
        },
        { text: client.clientName, fontSize: 9, bold: true, margin: [0, 0, 0, 2], alignment: 'right' },
        { text: shippingAddress.street, fontSize: 8, margin: [0, 0, 0, 1], alignment: 'right' },
        { text: `${shippingAddress.city}, ${shippingAddress.state} - ${shippingAddress.pincode}`, fontSize: 8, margin: [0, 0, 0, 2], alignment: 'right' },
        ...(showGSTIN && client.gstin ? [{ text: `GSTIN: ${client.gstin}`, fontSize: 8, margin: [0, 0, 0, 1], alignment: 'right' }] : []),
        ...(showPhone ? [{ text: `Phone: ${client.contact.phone}`, fontSize: 8, margin: [0, 0, 0, 1], alignment: 'right' }] : []),
        ...(showEmail && client.contact?.email ? [{ text: `Email: ${client.contact.email}`, fontSize: 8, margin: [0, 0, 0, 1], alignment: 'right' }] : []),
        { text: `Place of Supply: ${shippingAddress.state}`, fontSize: 8, margin: [0, 2, 0, 0], bold: true, color: '#059669', alignment: 'right' },
      ],
    });
  }

  return {
    columns,
    // Add a small top margin so there's spacing between header and this section,
    // and slightly increase bottom margin for separation from the items table.
    margin: [0, 5, 0, 25],
  };
};
