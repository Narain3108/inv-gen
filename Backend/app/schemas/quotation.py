"""
Quotation Pydantic Schemas
"""

from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Literal
from uuid import UUID

from pydantic import Field

from app.schemas.common import BaseSchema


# ==================== Quotation Item Schemas ====================

class QuotationItemBase(BaseSchema):
    """Base quotation item schema"""
    description: str = Field(..., min_length=1)
    hsn: str = Field(..., max_length=20)
    quantity: Decimal = Field(..., gt=0, decimal_places=3)
    unit: str = Field(..., max_length=50)
    unit_price: Decimal = Field(..., ge=0, decimal_places=2)
    discount: Decimal = Field(default=0, ge=0, decimal_places=2)
    gst_rate: Decimal = Field(..., ge=0, le=100, decimal_places=2)
    cess_rate: Optional[Decimal] = Field(default=0, ge=0, le=100, decimal_places=2)


class QuotationItemCreate(QuotationItemBase):
    """Schema for creating quotation item"""
    product_id: Optional[UUID] = None
    item_code: Optional[str] = Field(None, max_length=50)
    serial_numbers: Optional[List[str]] = None


class QuotationItemOut(QuotationItemBase):
    """Schema for quotation item output"""
    id: UUID
    quotation_id: UUID
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


# ==================== Quotation Schemas ====================

class QuotationBase(BaseSchema):
    """Base quotation schema"""
    date: datetime
    valid_until: datetime


class QuotationCreate(QuotationBase):
    """Schema for creating quotation"""
    company_id: UUID
    client_id: UUID
    items: List[QuotationItemCreate] = Field(..., min_length=1)


class QuotationUpdate(BaseSchema):
    """Schema for updating quotation"""
    date: Optional[datetime] = None
    valid_until: Optional[datetime] = None
    status: Optional[Literal["pending", "accepted", "rejected", "converted", "expired"]] = None
    items: Optional[List[QuotationItemCreate]] = None


class QuotationOut(QuotationBase):
    """Schema for quotation output"""
    id: UUID
    quotation_number: str
    company_id: UUID
    client_id: UUID
    status: Literal["pending", "accepted", "rejected", "converted", "expired"]
    total_amount: Decimal
    total_amount_in_words: str
    taxable_amount: Decimal
    cgst: Decimal
    sgst: Decimal
    igst: Decimal
    tax_breakdown: Optional[dict] = None
    converted_to_invoice_id: Optional[UUID] = None
    items: List[QuotationItemOut] = []
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = BaseSchema.model_config


class QuotationListOut(BaseSchema):
    """Simplified quotation schema for list views"""
    id: UUID
    quotation_number: str
    company_id: UUID
    client_id: UUID
    date: datetime
    valid_until: datetime
    status: Literal["pending", "accepted", "rejected", "converted", "expired"]
    total_amount: Decimal
    created_at: datetime
    
    model_config = BaseSchema.model_config
