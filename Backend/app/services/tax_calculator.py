"""
Tax Calculation Service
Handles GST calculations (CGST, SGST, IGST, CESS)
"""

from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Tuple


class TaxCalculator:
    """GST tax calculator for Indian invoices"""
    
    @staticmethod
    def calculate_line_taxes(
        quantity: Decimal,
        unit_price: Decimal,
        discount: Decimal,
        gst_rate: Decimal,
        cess_rate: Decimal,
        is_inter_state: bool
    ) -> Dict[str, Decimal]:
        """
        Calculate taxes for a single line item
        
        Args:
            quantity: Item quantity
            unit_price: Unit price before tax
            discount: Discount amount
            gst_rate: GST rate percentage (e.g., 18 for 18%)
            cess_rate: Cess rate percentage
            is_inter_state: True for IGST, False for CGST+SGST
            
        Returns:
            Dictionary with taxable_amount, cgst, sgst, igst, cess, line_total
        """
        # Calculate taxable amount
        gross_amount = (quantity * unit_price).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        taxable_amount = (gross_amount - discount).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Calculate GST
        gst_amount = (taxable_amount * gst_rate / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        if is_inter_state:
            # Interstate: IGST
            cgst = Decimal('0.00')
            sgst = Decimal('0.00')
            igst = gst_amount
        else:
            # Intrastate: CGST + SGST
            cgst = (gst_amount / 2).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            sgst = (gst_amount / 2).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
            igst = Decimal('0.00')
        
        # Calculate CESS
        cess = Decimal('0.00')
        if cess_rate and cess_rate > 0:
            cess = (taxable_amount * cess_rate / 100).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Calculate line total
        line_total = taxable_amount + cgst + sgst + igst + cess
        
        return {
            'taxable_amount': taxable_amount,
            'cgst': cgst,
            'sgst': sgst,
            'igst': igst,
            'cess': cess,
            'line_total': line_total
        }
    
    @staticmethod
    def calculate_invoice_totals(
        items: List[Dict],
        company_state: str,
        client_state: str
    ) -> Dict[str, Decimal]:
        """
        Calculate total taxes for all items in an invoice
        
        Args:
            items: List of item dictionaries with quantity, unit_price, discount, gst_rate, cess_rate
            company_state: Company's state
            client_state: Client's state
            
        Returns:
            Dictionary with taxable_amount, cgst, sgst, igst, total_cess, grand_total, tax_breakdown
        """
        is_inter_state = company_state.strip().lower() != client_state.strip().lower()
        
        total_taxable = Decimal('0.00')
        total_cgst = Decimal('0.00')
        total_sgst = Decimal('0.00')
        total_igst = Decimal('0.00')
        total_cess = Decimal('0.00')
        
        # Tax breakdown by rate
        tax_breakdown: Dict[str, Dict[str, Decimal]] = {}
        
        for item in items:
            taxes = TaxCalculator.calculate_line_taxes(
                quantity=Decimal(str(item.get('quantity', 0))),
                unit_price=Decimal(str(item.get('unit_price', 0))),
                discount=Decimal(str(item.get('discount', 0))),
                gst_rate=Decimal(str(item.get('gst_rate', 0))),
                cess_rate=Decimal(str(item.get('cess_rate', 0))),
                is_inter_state=is_inter_state
            )
            
            total_taxable += taxes['taxable_amount']
            total_cgst += taxes['cgst']
            total_sgst += taxes['sgst']
            total_igst += taxes['igst']
            total_cess += taxes['cess']
            
            # Group by GST rate for breakdown
            rate_key = str(item.get('gst_rate', 0))
            if rate_key not in tax_breakdown:
                tax_breakdown[rate_key] = {
                    'rate': Decimal(str(item.get('gst_rate', 0))),
                    'taxable_amount': Decimal('0.00'),
                    'cgst': Decimal('0.00'),
                    'sgst': Decimal('0.00'),
                    'igst': Decimal('0.00'),
                    'cess': Decimal('0.00'),
                    'total_tax': Decimal('0.00')
                }
            
            tax_breakdown[rate_key]['taxable_amount'] += taxes['taxable_amount']
            tax_breakdown[rate_key]['cgst'] += taxes['cgst']
            tax_breakdown[rate_key]['sgst'] += taxes['sgst']
            tax_breakdown[rate_key]['igst'] += taxes['igst']
            tax_breakdown[rate_key]['cess'] += taxes['cess']
            tax_breakdown[rate_key]['total_tax'] += (
                taxes['cgst'] + taxes['sgst'] + taxes['igst'] + taxes['cess']
            )
        
        grand_total = total_taxable + total_cgst + total_sgst + total_igst + total_cess
        
        return {
            'taxable_amount': total_taxable,
            'cgst': total_cgst,
            'sgst': total_sgst,
            'igst': total_igst,
            'cess': total_cess,
            'grand_total': grand_total,
            'tax_breakdown': list(tax_breakdown.values())
        }


def calculate_item_taxes(
    quantity: Decimal,
    unit_price: Decimal,
    discount: Decimal,
    gst_rate: Decimal,
    cess_rate: Decimal,
    is_inter_state: bool
) -> Tuple[Decimal, Decimal, Decimal, Decimal, Decimal]:
    """
    Convenience function to calculate taxes for a single item
    
    Returns:
        Tuple of (cgst, sgst, igst, cess, line_total)
    """
    taxes = TaxCalculator.calculate_line_taxes(
        quantity, unit_price, discount, gst_rate, cess_rate, is_inter_state
    )
    return (
        taxes['cgst'],
        taxes['sgst'],
        taxes['igst'],
        taxes['cess'],
        taxes['line_total']
    )
