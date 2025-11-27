"""
Number to Words Converter (Indian Rupees)
Converts numeric amounts to words for invoices
"""

from decimal import Decimal


def amount_to_words(amount: Decimal) -> str:
    """
    Convert amount to words in Indian Rupees
    
    Args:
        amount: Decimal amount
        
    Returns:
        Amount in words (e.g., "One Thousand Two Hundred Thirty Four Rupees and Fifty Paise Only")
    """
    # Split into rupees and paise
    rupees = int(amount)
    paise = int((amount - rupees) * 100)
    
    result = []
    
    if rupees > 0:
        rupees_words = _number_to_words_indian(rupees)
        if rupees == 1:
            result.append(f"{rupees_words} Rupee")
        else:
            result.append(f"{rupees_words} Rupees")
    else:
        result.append("Zero Rupees")
    
    if paise > 0:
        paise_words = _number_to_words_indian(paise)
        if paise == 1:
            result.append(f"and {paise_words} Paisa")
        else:
            result.append(f"and {paise_words} Paise")
    
    result.append("Only")
    
    return " ".join(result)


def _number_to_words_indian(n: int) -> str:
    """
    Convert number to words using Indian numbering system
    (Ones, Tens, Hundreds, Thousands, Lakhs, Crores)
    """
    if n == 0:
        return "Zero"
    
    # Number word mappings
    ones = [
        "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
        "Seventeen", "Eighteen", "Nineteen"
    ]
    
    tens = [
        "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
    ]
    
    def convert_below_thousand(num: int) -> str:
        """Convert numbers below 1000"""
        if num == 0:
            return ""
        elif num < 20:
            return ones[num]
        elif num < 100:
            return tens[num // 10] + (" " + ones[num % 10] if num % 10 != 0 else "")
        else:
            return (
                ones[num // 100] + " Hundred" +
                (" " + convert_below_thousand(num % 100) if num % 100 != 0 else "")
            )
    
    # Indian numbering system: Crores, Lakhs, Thousands, Hundreds
    if n >= 10000000:  # Crores
        crores = n // 10000000
        remainder = n % 10000000
        result = convert_below_thousand(crores) + " Crore"
        if remainder > 0:
            result += " " + _number_to_words_indian(remainder)
        return result
    
    elif n >= 100000:  # Lakhs
        lakhs = n // 100000
        remainder = n % 100000
        result = convert_below_thousand(lakhs) + " Lakh"
        if remainder > 0:
            result += " " + _number_to_words_indian(remainder)
        return result
    
    elif n >= 1000:  # Thousands
        thousands = n // 1000
        remainder = n % 1000
        result = convert_below_thousand(thousands) + " Thousand"
        if remainder > 0:
            result += " " + convert_below_thousand(remainder)
        return result
    
    else:
        return convert_below_thousand(n)


# Example usage and tests
if __name__ == "__main__":
    test_amounts = [
        Decimal("0.00"),
        Decimal("1.00"),
        Decimal("15.50"),
        Decimal("100.99"),
        Decimal("1234.56"),
        Decimal("12345.67"),
        Decimal("123456.78"),
        Decimal("1234567.89"),
        Decimal("12345678.90"),
    ]
    
    for amount in test_amounts:
        print(f"{amount}: {amount_to_words(amount)}")
