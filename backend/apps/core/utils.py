"""
Utility Functions and Helpers
"""

import re
from typing import Dict, Any
from decimal import Decimal


def validate_gstin(gstin: str) -> bool:
    """
    Validate GSTIN format
    Format: 2 digits (state) + 10 chars (PAN) + 1 char (entity) + Z + 1 char (checksum)
    """
    pattern = r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'
    return bool(re.match(pattern, gstin))


def validate_pan(pan: str) -> bool:
    """Validate PAN format"""
    pattern = r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$'
    return bool(re.match(pattern, pan))


def validate_phone(phone: str) -> bool:
    """Validate Indian phone number"""
    pattern = r'^[6-9]\d{9}$'
    return bool(re.match(pattern, phone))


def validate_pincode(pincode: str) -> bool:
    """Validate Indian pincode"""
    pattern = r'^[1-9][0-9]{5}$'
    return bool(re.match(pattern, pincode))


def validate_ifsc(ifsc: str) -> bool:
    """Validate IFSC code"""
    pattern = r'^[A-Z]{4}0[A-Z0-9]{6}$'
    return bool(re.match(pattern, ifsc))


def get_state_from_gstin(gstin: str) -> str:
    """Extract state code from GSTIN"""
    if not validate_gstin(gstin):
        return ''
    return gstin[:2]


def calculate_gst(
    amount: Decimal,
    gst_rate: Decimal,
    is_intra_state: bool = True
) -> Dict[str, Decimal]:
    """
    Calculate GST breakdown
    
    Args:
        amount: Taxable amount
        gst_rate: GST rate (e.g., 18 for 18%)
        is_intra_state: True for CGST+SGST, False for IGST
    
    Returns:
        Dictionary with cgst, sgst, igst, total_gst
    """
    total_gst = (amount * gst_rate) / 100
    
    if is_intra_state:
        # CGST + SGST (same state)
        cgst = total_gst / 2
        sgst = total_gst / 2
        igst = Decimal('0')
    else:
        # IGST (inter-state)
        cgst = Decimal('0')
        sgst = Decimal('0')
        igst = total_gst
    
    return {
        'cgst': cgst.quantize(Decimal('0.01')),
        'sgst': sgst.quantize(Decimal('0.01')),
        'igst': igst.quantize(Decimal('0.01')),
        'total_gst': total_gst.quantize(Decimal('0.01')),
    }


def number_to_words(amount: Decimal) -> str:
    """
    Convert number to Indian Rupees in words
    Example: 1234.56 -> "One Thousand Two Hundred Thirty Four Rupees and Fifty Six Paise"
    """
    ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
    
    def convert_less_than_thousand(n: int) -> str:
        if n == 0:
            return ''
        elif n < 10:
            return ones[n]
        elif n < 20:
            return teens[n - 10]
        elif n < 100:
            return tens[n // 10] + (' ' + ones[n % 10] if n % 10 != 0 else '')
        else:
            return ones[n // 100] + ' Hundred' + (' ' + convert_less_than_thousand(n % 100) if n % 100 != 0 else '')
    
    def convert_indian_format(n: int) -> str:
        if n == 0:
            return 'Zero'
        
        crore = n // 10000000
        lakh = (n % 10000000) // 100000
        thousand = (n % 100000) // 1000
        hundred = n % 1000
        
        result = ''
        
        if crore > 0:
            result += convert_less_than_thousand(crore) + ' Crore '
        if lakh > 0:
            result += convert_less_than_thousand(lakh) + ' Lakh '
        if thousand > 0:
            result += convert_less_than_thousand(thousand) + ' Thousand '
        if hundred > 0:
            result += convert_less_than_thousand(hundred)
        
        return result.strip()
    
    # Split into rupees and paise
    rupees = int(amount)
    paise = int((amount - rupees) * 100)
    
    result = convert_indian_format(rupees) + ' Rupees'
    
    if paise > 0:
        result += ' and ' + convert_less_than_thousand(paise) + ' Paise'
    
    result += ' Only'
    
    return result


def sanitize_filename(filename: str) -> str:
    """Sanitize filename for safe storage"""
    # Remove special characters
    filename = re.sub(r'[^\w\s.-]', '', filename)
    # Replace spaces with underscores
    filename = re.sub(r'\s+', '_', filename)
    return filename.lower()
