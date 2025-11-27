"""
Company Pydantic Schemas
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field

from app.schemas.common import (
    BaseSchema, AddressSchema, ContactSchema, 
    BankDetailsSchema, NumberingConfigSchema
)


class CompanyBase(BaseSchema):
    """Base company schema"""
    name: str = Field(..., min_length=1, max_length=255)
    gstin: Optional[str] = Field(None, max_length=15, pattern=r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
    state: Optional[str] = Field(None, max_length=100)
    pan: Optional[str] = Field(None, max_length=10, pattern=r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$')
    website: Optional[str] = None


class CompanyCreate(CompanyBase):
    """Schema for creating a company"""
    user_id: UUID
    address: Optional[AddressSchema] = None
    contact: Optional[ContactSchema] = None
    bank_details: Optional[BankDetailsSchema] = None
    invoice_numbering: Optional[NumberingConfigSchema] = None
    quotation_numbering: Optional[NumberingConfigSchema] = None
    logo_url: Optional[str] = None
    signature_url: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    additional_notes: Optional[str] = None


class CompanyUpdate(BaseSchema):
    """Schema for updating a company"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    gstin: Optional[str] = Field(None, max_length=15)
    state: Optional[str] = Field(None, max_length=100)
    pan: Optional[str] = Field(None, max_length=10)
    website: Optional[str] = None
    address: Optional[AddressSchema] = None
    contact: Optional[ContactSchema] = None
    bank_details: Optional[BankDetailsSchema] = None
    invoice_numbering: Optional[NumberingConfigSchema] = None
    quotation_numbering: Optional[NumberingConfigSchema] = None
    logo_url: Optional[str] = None
    signature_url: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    additional_notes: Optional[str] = None


class CompanyOut(CompanyBase):
    """Schema for company output"""
    id: UUID
    user_id: UUID
    address: Optional[dict] = None
    contact: Optional[dict] = None
    bank_details: Optional[dict] = None
    invoice_numbering: Optional[dict] = None
    quotation_numbering: Optional[dict] = None
    logo_url: Optional[str] = None
    signature_url: Optional[str] = None
    terms_and_conditions: Optional[str] = None
    additional_notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = BaseSchema.model_config
