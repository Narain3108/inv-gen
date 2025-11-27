"""
Quotation API Endpoints
"""

from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.db.models import Quotation, QuotationItem, Company, Client, Invoice, InvoiceItem
from app.schemas.quotation import QuotationCreate, QuotationOut, QuotationUpdate, QuotationListOut
from app.schemas.common import MessageResponse, PaginationParams, PaginatedResponse, IDResponse
from app.services.tax_calculator import TaxCalculator
from app.services.number_generator import generate_quotation_number, generate_invoice_number
from app.services.number_to_words import amount_to_words

router = APIRouter()


@router.post("/", response_model=IDResponse, status_code=status.HTTP_201_CREATED)
async def create_quotation(
    quotation_data: QuotationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new quotation with automatic calculations"""
    # Verify company and client exist
    company_result = await db.execute(
        select(Company).where(Company.id == quotation_data.company_id)
    )
    company = company_result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    client_result = await db.execute(
        select(Client).where(Client.id == quotation_data.client_id)
    )
    client = client_result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Get state information for tax calculation
    company_state = company.state or company.address.get('state', '') if company.address else ''
    client_state = client.address.get('state', '') if client.address else ''
    is_inter_state = company_state.strip().lower() != client_state.strip().lower()
    
    # Generate quotation number
    quotation_number = await generate_quotation_number(
        db, str(quotation_data.company_id), company.quotation_numbering
    )
    
    # Calculate totals for all items
    items_data = []
    total_taxable = Decimal('0.00')
    total_cgst = Decimal('0.00')
    total_sgst = Decimal('0.00')
    total_igst = Decimal('0.00')
    total_cess = Decimal('0.00')
    
    for item_input in quotation_data.items:
        taxes = TaxCalculator.calculate_line_taxes(
            quantity=item_input.quantity,
            unit_price=item_input.unit_price,
            discount=item_input.discount,
            gst_rate=item_input.gst_rate,
            cess_rate=item_input.cess_rate or Decimal('0.00'),
            is_inter_state=is_inter_state
        )
        
        total_taxable += taxes['taxable_amount']
        total_cgst += taxes['cgst']
        total_sgst += taxes['sgst']
        total_igst += taxes['igst']
        total_cess += taxes['cess']
        
        items_data.append({
            **item_input.model_dump(),
            'cgst': taxes['cgst'],
            'sgst': taxes['sgst'],
            'igst': taxes['igst'],
            'cess': taxes['cess'],
            'line_total': taxes['line_total']
        })
    
    total_amount = total_taxable + total_cgst + total_sgst + total_igst + total_cess
    total_amount_words = amount_to_words(total_amount)
    
    # Create quotation
    quotation = Quotation(
        quotation_number=quotation_number,
        company_id=quotation_data.company_id,
        client_id=quotation_data.client_id,
        date=quotation_data.date,
        valid_until=quotation_data.valid_until,
        status='pending',
        total_amount=total_amount,
        total_amount_in_words=total_amount_words,
        taxable_amount=total_taxable,
        cgst=total_cgst,
        sgst=total_sgst,
        igst=total_igst
    )
    
    db.add(quotation)
    await db.flush()
    
    # Create quotation items
    for item_data in items_data:
        quotation_item = QuotationItem(
            quotation_id=quotation.id,
            **item_data
        )
        db.add(quotation_item)
    
    await db.flush()
    
    return IDResponse(
        id=quotation.id,
        message=f"Quotation {quotation_number} created successfully"
    )


@router.get("/", response_model=PaginatedResponse[QuotationListOut])
async def list_quotations(
    company_id: Optional[UUID] = Query(None, description="Filter by company ID"),
    client_id: Optional[UUID] = Query(None, description="Filter by client ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    search: Optional[str] = Query(None, description="Search by quotation number"),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List quotations with optional filtering"""
    # Build query
    query = select(Quotation)
    
    # Apply filters
    if company_id:
        query = query.where(Quotation.company_id == company_id)
    
    if client_id:
        query = query.where(Quotation.client_id == client_id)
    
    if status:
        query = query.where(Quotation.status == status)
    
    if date_from:
        query = query.where(Quotation.date >= date_from)
    
    if date_to:
        query = query.where(Quotation.date <= date_to)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(Quotation.quotation_number.ilike(search_pattern))
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(pagination.skip).limit(pagination.limit).order_by(Quotation.date.desc())
    result = await db.execute(query)
    quotations = result.scalars().all()
    
    return PaginatedResponse.create(
        items=quotations,
        total=total,
        page=pagination.page,
        limit=pagination.limit
    )


@router.get("/{quotation_id}", response_model=QuotationOut)
async def get_quotation(
    quotation_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get quotation by ID with items"""
    result = await db.execute(
        select(Quotation)
        .options(selectinload(Quotation.items))
        .where(Quotation.id == quotation_id)
    )
    quotation = result.scalar_one_or_none()
    
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found"
        )
    
    return quotation


@router.put("/{quotation_id}", response_model=QuotationOut)
async def update_quotation(
    quotation_id: UUID,
    quotation_data: QuotationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update quotation"""
    result = await db.execute(
        select(Quotation)
        .options(selectinload(Quotation.items))
        .where(Quotation.id == quotation_id)
    )
    quotation = result.scalar_one_or_none()
    
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found"
        )
    
    # Update simple fields
    if quotation_data.date:
        quotation.date = quotation_data.date
    
    if quotation_data.valid_until:
        quotation.valid_until = quotation_data.valid_until
    
    if quotation_data.status:
        quotation.status = quotation_data.status
    
    # If updating items, recalculate totals
    if quotation_data.items is not None:
        # Get company and client for tax calculation
        company_result = await db.execute(
            select(Company).where(Company.id == quotation.company_id)
        )
        company = company_result.scalar_one()
        
        client_result = await db.execute(
            select(Client).where(Client.id == quotation.client_id)
        )
        client = client_result.scalar_one()
        
        company_state = company.state or company.address.get('state', '') if company.address else ''
        client_state = client.address.get('state', '') if client.address else ''
        is_inter_state = company_state.strip().lower() != client_state.strip().lower()
        
        # Delete old items
        for old_item in quotation.items:
            await db.delete(old_item)
        
        # Recalculate with new items
        items_data = []
        total_taxable = Decimal('0.00')
        total_cgst = Decimal('0.00')
        total_sgst = Decimal('0.00')
        total_igst = Decimal('0.00')
        total_cess = Decimal('0.00')
        
        for item_input in quotation_data.items:
            taxes = TaxCalculator.calculate_line_taxes(
                quantity=item_input.quantity,
                unit_price=item_input.unit_price,
                discount=item_input.discount,
                gst_rate=item_input.gst_rate,
                cess_rate=item_input.cess_rate or Decimal('0.00'),
                is_inter_state=is_inter_state
            )
            
            total_taxable += taxes['taxable_amount']
            total_cgst += taxes['cgst']
            total_sgst += taxes['sgst']
            total_igst += taxes['igst']
            total_cess += taxes['cess']
            
            items_data.append({
                **item_input.model_dump(),
                'cgst': taxes['cgst'],
                'sgst': taxes['sgst'],
                'igst': taxes['igst'],
                'cess': taxes['cess'],
                'line_total': taxes['line_total']
            })
        
        total_amount = total_taxable + total_cgst + total_sgst + total_igst + total_cess
        
        # Update quotation totals
        quotation.total_amount = total_amount
        quotation.total_amount_in_words = amount_to_words(total_amount)
        quotation.taxable_amount = total_taxable
        quotation.cgst = total_cgst
        quotation.sgst = total_sgst
        quotation.igst = total_igst
        
        # Create new items
        for item_data in items_data:
            quotation_item = QuotationItem(
                quotation_id=quotation.id,
                **item_data
            )
            db.add(quotation_item)
    
    await db.flush()
    await db.refresh(quotation)
    
    return quotation


@router.delete("/{quotation_id}", response_model=MessageResponse)
async def delete_quotation(
    quotation_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete quotation"""
    result = await db.execute(
        select(Quotation).where(Quotation.id == quotation_id)
    )
    quotation = result.scalar_one_or_none()
    
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found"
        )
    
    await db.delete(quotation)
    await db.flush()
    
    return MessageResponse(message="Quotation deleted successfully")


@router.post("/{quotation_id}/convert", response_model=IDResponse)
async def convert_to_invoice(
    quotation_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Convert quotation to invoice"""
    # Get quotation with items
    result = await db.execute(
        select(Quotation)
        .options(selectinload(Quotation.items))
        .where(Quotation.id == quotation_id)
    )
    quotation = result.scalar_one_or_none()
    
    if not quotation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Quotation not found"
        )
    
    if quotation.status == 'converted':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Quotation already converted to invoice"
        )
    
    # Get company for invoice numbering
    company_result = await db.execute(
        select(Company).where(Company.id == quotation.company_id)
    )
    company = company_result.scalar_one()
    
    # Generate invoice number
    invoice_number = await generate_invoice_number(
        db, str(quotation.company_id), company.invoice_numbering
    )
    
    # Create invoice from quotation
    invoice = Invoice(
        invoice_number=invoice_number,
        company_id=quotation.company_id,
        client_id=quotation.client_id,
        date=datetime.now(),
        total_amount=quotation.total_amount,
        total_amount_in_words=quotation.total_amount_in_words,
        taxable_amount=quotation.taxable_amount,
        cgst=quotation.cgst,
        sgst=quotation.sgst,
        igst=quotation.igst,
        payment_status='pending',
        amount_paid=Decimal('0.00'),
        amount_pending=quotation.total_amount
    )
    
    db.add(invoice)
    await db.flush()
    
    # Copy items from quotation to invoice
    for quot_item in quotation.items:
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            product_id=quot_item.product_id,
            item_code=quot_item.item_code,
            description=quot_item.description,
            hsn=quot_item.hsn,
            quantity=quot_item.quantity,
            unit=quot_item.unit,
            unit_price=quot_item.unit_price,
            discount=quot_item.discount,
            gst_rate=quot_item.gst_rate,
            cess_rate=quot_item.cess_rate,
            cgst=quot_item.cgst,
            sgst=quot_item.sgst,
            igst=quot_item.igst,
            cess=quot_item.cess,
            line_total=quot_item.line_total,
            serial_numbers=quot_item.serial_numbers
        )
        db.add(invoice_item)
    
    # Update quotation status
    quotation.status = 'converted'
    quotation.converted_to_invoice_id = invoice.id
    
    await db.flush()
    
    return IDResponse(
        id=invoice.id,
        message=f"Quotation converted to invoice {invoice_number}"
    )
