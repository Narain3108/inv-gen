"""
Invoice API Endpoints
"""

from typing import List, Optional
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.db.models import Invoice, InvoiceItem, Payment, Company, Client, Product
from app.schemas.invoice import InvoiceCreate, InvoiceOut, InvoiceUpdate, InvoiceListOut, PaymentCreate, PaymentOut
from app.schemas.common import MessageResponse, PaginationParams, PaginatedResponse, IDResponse
from app.services.tax_calculator import TaxCalculator
from app.services.number_generator import generate_invoice_number
from app.services.number_to_words import amount_to_words

router = APIRouter()


@router.post("/", response_model=IDResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(
    invoice_data: InvoiceCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new invoice with automatic calculations"""
    # Verify company and client exist
    company_result = await db.execute(
        select(Company).where(Company.id == invoice_data.company_id)
    )
    company = company_result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    client_result = await db.execute(
        select(Client).where(Client.id == invoice_data.client_id)
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
    
    # Generate invoice number
    invoice_number = await generate_invoice_number(
        db, str(invoice_data.company_id), company.invoice_numbering
    )
    
    # Calculate totals for all items
    items_data = []
    total_taxable = Decimal('0.00')
    total_cgst = Decimal('0.00')
    total_sgst = Decimal('0.00')
    total_igst = Decimal('0.00')
    total_cess = Decimal('0.00')
    
    for item_input in invoice_data.items:
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
    
    # Create invoice
    invoice = Invoice(
        invoice_number=invoice_number,
        company_id=invoice_data.company_id,
        client_id=invoice_data.client_id,
        date=invoice_data.date,
        total_amount=total_amount,
        total_amount_in_words=total_amount_words,
        taxable_amount=total_taxable,
        cgst=total_cgst,
        sgst=total_sgst,
        igst=total_igst,
        payment_status='pending',
        amount_paid=Decimal('0.00'),
        amount_pending=total_amount
    )
    
    db.add(invoice)
    await db.flush()
    
    # Create invoice items
    for item_data in items_data:
        invoice_item = InvoiceItem(
            invoice_id=invoice.id,
            **item_data
        )
        db.add(invoice_item)
    
    await db.flush()
    
    return IDResponse(
        id=invoice.id,
        message=f"Invoice {invoice_number} created successfully"
    )


@router.get("/", response_model=PaginatedResponse[InvoiceListOut])
async def list_invoices(
    company_id: Optional[UUID] = Query(None, description="Filter by company ID"),
    client_id: Optional[UUID] = Query(None, description="Filter by client ID"),
    payment_status: Optional[str] = Query(None, description="Filter by payment status"),
    date_from: Optional[datetime] = Query(None, description="Filter from date"),
    date_to: Optional[datetime] = Query(None, description="Filter to date"),
    search: Optional[str] = Query(None, description="Search by invoice number"),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List invoices with optional filtering"""
    # Build query
    query = select(Invoice)
    
    # Apply filters
    if company_id:
        query = query.where(Invoice.company_id == company_id)
    
    if client_id:
        query = query.where(Invoice.client_id == client_id)
    
    if payment_status:
        query = query.where(Invoice.payment_status == payment_status)
    
    if date_from:
        query = query.where(Invoice.date >= date_from)
    
    if date_to:
        query = query.where(Invoice.date <= date_to)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(Invoice.invoice_number.ilike(search_pattern))
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(pagination.skip).limit(pagination.limit).order_by(Invoice.date.desc())
    result = await db.execute(query)
    invoices = result.scalars().all()
    
    return PaginatedResponse.create(
        items=invoices,
        total=total,
        page=pagination.page,
        limit=pagination.limit
    )


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get invoice by ID with items and payments"""
    result = await db.execute(
        select(Invoice)
        .options(
            selectinload(Invoice.items),
            selectinload(Invoice.payments)
        )
        .where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceOut)
async def update_invoice(
    invoice_id: UUID,
    invoice_data: InvoiceUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update invoice"""
    result = await db.execute(
        select(Invoice)
        .options(selectinload(Invoice.items))
        .where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # If updating items, recalculate totals
    if invoice_data.items is not None:
        # Get company and client for tax calculation
        company_result = await db.execute(
            select(Company).where(Company.id == invoice.company_id)
        )
        company = company_result.scalar_one()
        
        client_result = await db.execute(
            select(Client).where(Client.id == invoice.client_id)
        )
        client = client_result.scalar_one()
        
        company_state = company.state or company.address.get('state', '') if company.address else ''
        client_state = client.address.get('state', '') if client.address else ''
        is_inter_state = company_state.strip().lower() != client_state.strip().lower()
        
        # Delete old items
        for old_item in invoice.items:
            await db.delete(old_item)
        
        # Recalculate with new items
        items_data = []
        total_taxable = Decimal('0.00')
        total_cgst = Decimal('0.00')
        total_sgst = Decimal('0.00')
        total_igst = Decimal('0.00')
        total_cess = Decimal('0.00')
        
        for item_input in invoice_data.items:
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
        
        # Update invoice totals
        invoice.total_amount = total_amount
        invoice.total_amount_in_words = amount_to_words(total_amount)
        invoice.taxable_amount = total_taxable
        invoice.cgst = total_cgst
        invoice.sgst = total_sgst
        invoice.igst = total_igst
        invoice.amount_pending = total_amount - invoice.amount_paid
        
        # Create new items
        for item_data in items_data:
            invoice_item = InvoiceItem(
                invoice_id=invoice.id,
                **item_data
            )
            db.add(invoice_item)
    
    # Update other fields
    if invoice_data.date:
        invoice.date = invoice_data.date
    
    if invoice_data.payment_status:
        invoice.payment_status = invoice_data.payment_status
    
    await db.flush()
    await db.refresh(invoice)
    
    return invoice


@router.delete("/{invoice_id}", response_model=MessageResponse)
async def delete_invoice(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete invoice"""
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    await db.delete(invoice)
    await db.flush()
    
    return MessageResponse(message="Invoice deleted successfully")


# ==================== Payment Endpoints ====================

@router.post("/{invoice_id}/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
async def record_payment(
    invoice_id: UUID,
    payment_data: PaymentCreate,
    db: AsyncSession = Depends(get_db)
):
    """Record a payment for an invoice"""
    # Get invoice
    result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id)
    )
    invoice = result.scalar_one_or_none()
    
    if not invoice:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invoice not found"
        )
    
    # Validate payment amount
    if payment_data.amount > invoice.amount_pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment amount ({payment_data.amount}) exceeds pending amount ({invoice.amount_pending})"
        )
    
    # Create payment record
    payment = Payment(
        invoice_id=invoice_id,
        **payment_data.model_dump()
    )
    db.add(payment)
    
    # Update invoice payment status
    invoice.amount_paid += payment_data.amount
    invoice.amount_pending -= payment_data.amount
    
    if invoice.amount_pending <= Decimal('0.00'):
        invoice.payment_status = 'paid'
    elif invoice.amount_paid > Decimal('0.00'):
        invoice.payment_status = 'partially_paid'
    
    await db.flush()
    await db.refresh(payment)
    
    return payment


@router.get("/{invoice_id}/payments", response_model=List[PaymentOut])
async def list_payments(
    invoice_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """List all payments for an invoice"""
    result = await db.execute(
        select(Payment)
        .where(Payment.invoice_id == invoice_id)
        .order_by(Payment.payment_date.desc())
    )
    payments = result.scalars().all()
    
    return payments
