"""
Invoice and Quotation Number Generator
"""

from datetime import datetime
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.db.models import Invoice, Quotation, Company


async def generate_invoice_number(
    db: AsyncSession,
    company_id: str,
    company_numbering: Optional[dict] = None
) -> str:
    """
    Generate next invoice number for a company
    
    Args:
        db: Database session
        company_id: Company UUID
        company_numbering: Optional numbering configuration
        
    Returns:
        Generated invoice number string
    """
    # Default numbering config
    prefix = "INV"
    suffix = ""
    order = "prefix-number-suffix"
    
    if company_numbering:
        prefix = company_numbering.get('prefix', 'INV')
        suffix = company_numbering.get('suffix', '')
        order = company_numbering.get('order', 'prefix-number-suffix')
        next_num = company_numbering.get('next_number', 1)
    else:
        next_num = 1
    
    # Get the highest invoice number for this company
    result = await db.execute(
        select(func.count(Invoice.id))
        .where(Invoice.company_id == company_id)
    )
    count = result.scalar() or 0
    
    # Generate number based on count + 1
    number = count + 1 if count >= next_num else next_num
    year = datetime.now().year
    
    # Format the invoice number based on order
    if order == "prefix-number-suffix":
        invoice_number = f"{prefix}-{year}-{str(number).zfill(4)}{suffix}"
    elif order == "number-prefix-suffix":
        invoice_number = f"{str(number).zfill(4)}-{prefix}{suffix}"
    else:
        invoice_number = f"{prefix}{str(number).zfill(4)}{suffix}"
    
    return invoice_number


async def generate_quotation_number(
    db: AsyncSession,
    company_id: str,
    company_numbering: Optional[dict] = None
) -> str:
    """
    Generate next quotation number for a company
    
    Args:
        db: Database session
        company_id: Company UUID
        company_numbering: Optional numbering configuration
        
    Returns:
        Generated quotation number string
    """
    # Default numbering config
    prefix = "QUO"
    suffix = ""
    order = "prefix-number-suffix"
    
    if company_numbering:
        prefix = company_numbering.get('prefix', 'QUO')
        suffix = company_numbering.get('suffix', '')
        order = company_numbering.get('order', 'prefix-number-suffix')
        next_num = company_numbering.get('next_number', 1)
    else:
        next_num = 1
    
    # Get the highest quotation number for this company
    result = await db.execute(
        select(func.count(Quotation.id))
        .where(Quotation.company_id == company_id)
    )
    count = result.scalar() or 0
    
    # Generate number based on count + 1
    number = count + 1 if count >= next_num else next_num
    year = datetime.now().year
    
    # Format the quotation number based on order
    if order == "prefix-number-suffix":
        quotation_number = f"{prefix}-{year}-{str(number).zfill(4)}{suffix}"
    elif order == "number-prefix-suffix":
        quotation_number = f"{str(number).zfill(4)}-{prefix}{suffix}"
    else:
        quotation_number = f"{prefix}{str(number).zfill(4)}{suffix}"
    
    return quotation_number
