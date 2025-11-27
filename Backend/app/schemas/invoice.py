"""
Invoice Pydantic Schemas
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Literal
from uuid import UUID

from pydantic import Field

from app.schemas.common import BaseSchema


# ==================== Invoice Item Schemas ====================

class InvoiceItemBase(BaseSchema):
    """Base invoice item schema"""
    description: str = Field(..., min_length=1)
    hsn: str = Field(..., max_length=20)
    quantity: Decimal = Field(..., gt=0, decimal_places=3)
    unit: str = Field(..., max_length=50)
    unit_price: Decimal = Field(..., ge=0, decimal_places=2)
    discount: Decimal = Field(default=0, ge=0, decimal_places=2)
    gst_rate: Decimal = Field(..., ge=0, le=100, decimal_places=2)
    cess_rate: Optional[Decimal] = Field(default=0, ge=0, le=100, decimal_places=2)


class InvoiceItemCreate(InvoiceItemBase):
    """Schema for creating invoice item"""
    product_id: Optional[UUID] = None
    item_code: Optional[str] = Field(None, max_length=50)
    serial_numbers: Optional[List[str]] = None


class InvoiceItemUpdate(BaseSchema):
    """Schema for updating invoice item"""
    product_id: Optional[UUID] = None
    item_code: Optional[str] = None
    description: Optional[str] = None
    hsn: Optional[str] = None
    quantity: Optional[Decimal] = Field(None, gt=0, decimal_places=3)
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    discount: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    gst_rate: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)
    cess_rate: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)
    serial_numbers: Optional[List[str]] = None


class InvoiceItemOut(InvoiceItemBase):
    """Schema for invoice item output"""
    id: UUID
    invoice_id: UUID
    product_id: Optional[UUID] = None
    item_code: Optional[str] = None
    cgst: Decimal
    sgst: Decimal
    igst: Decimal
    cess: Decimal
    line_total: Decimal
    serial_numbers: Optional[List[str]] = None
    created_at: datetime
    
    model_config = BaseSchema.model_config


# ==================== Payment Schemas ====================

class PaymentBase(BaseSchema):
    """Base payment schema"""
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    payment_date: datetime
    payment_mode: Optional[Literal[
        "cash", "upi", "bank_transfer", "cheque", 
        "credit_card", "debit_card", "net_banking"
    ]] = None
    reference_number: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    """Schema for creating payment"""
    pass


class PaymentUpdate(BaseSchema):
    """Schema for updating payment"""
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    payment_date: Optional[datetime] = None
    payment_mode: Optional[str] = None
    reference_number: Optional[str] = None
    notes: Optional[str] = None


class PaymentOut(PaymentBase):
    """Schema for payment output"""
    id: UUID
    invoice_id: UUID
    recorded_at: datetime
    created_at: datetime
    
    model_config = BaseSchema.model_config


# ==================== Invoice Schemas ====================

class InvoiceBase(BaseSchema):
    """Base invoice schema"""
    date: datetime
    

class InvoiceCreate(InvoiceBase):
    """Schema for creating invoice"""
    company_id: UUID
    client_id: UUID
    items: List[InvoiceItemCreate] = Field(..., min_length=1)
    # Server will calculate these fields automatically
    # invoice_number, totals, taxes, etc.


class InvoiceUpdate(BaseSchema):
    """Schema for updating invoice"""
    date: Optional[datetime] = None
    items: Optional[List[InvoiceItemCreate]] = None
    payment_status: Optional[Literal["pending", "partially_paid", "paid"]] = None


class InvoiceOut(InvoiceBase):
    """Schema for invoice output"""
    id: UUID
    invoice_number: str
    company_id: UUID
    client_id: UUID
    total_amount: Decimal
    total_amount_in_words: str
    taxable_amount: Decimal
    cgst: Decimal
    sgst: Decimal
    igst: Decimal
    tax_breakdown: Optional[dict] = None
    payment_status: Literal["pending", "partially_paid", "paid"]
    amount_paid: Decimal
    amount_pending: Decimal
    items: List[InvoiceItemOut] = []
    payments: List[PaymentOut] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = BaseSchema.model_config


class InvoiceListOut(BaseSchema):
    """Simplified invoice schema for list views"""
    id: UUID
    invoice_number: str
    company_id: UUID
    client_id: UUID
    date: datetime
    total_amount: Decimal
    payment_status: Literal["pending", "partially_paid", "paid"]
    amount_paid: Decimal
    amount_pending: Decimal
    created_at: datetime
    
    model_config = BaseSchema.model_config
