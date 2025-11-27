"""
Client Pydantic Schemas
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import Field

from app.schemas.common import (
    BaseSchema, AddressSchema, ContactSchema, BankDetailsSchema
)


class ClientBase(BaseSchema):
    """Base client schema"""
    client_name: str = Field(..., min_length=1, max_length=255)
    gstin: Optional[str] = Field(None, max_length=15)
    pan: Optional[str] = Field(None, max_length=10)


class ClientCreate(ClientBase):
    """Schema for creating a client"""
    company_id: Optional[UUID] = None  # Null for global clients
    address: Optional[AddressSchema] = None
    contact: Optional[ContactSchema] = None
    bank_details: Optional[BankDetailsSchema] = None
    billing_address: Optional[AddressSchema] = None
    shipping_address: Optional[AddressSchema] = None
    auto_fetched: bool = False


class ClientUpdate(BaseSchema):
    """Schema for updating a client"""
    client_name: Optional[str] = Field(None, min_length=1, max_length=255)
    gstin: Optional[str] = Field(None, max_length=15)
    pan: Optional[str] = Field(None, max_length=10)
    company_id: Optional[UUID] = None
    address: Optional[AddressSchema] = None
    contact: Optional[ContactSchema] = None
    bank_details: Optional[BankDetailsSchema] = None
    billing_address: Optional[AddressSchema] = None
    shipping_address: Optional[AddressSchema] = None
    auto_fetched: Optional[bool] = None


class ClientOut(ClientBase):
    """Schema for client output"""
    id: UUID
    company_id: Optional[UUID] = None
    address: Optional[dict] = None
    contact: Optional[dict] = None
    bank_details: Optional[dict] = None
    billing_address: Optional[dict] = None
    shipping_address: Optional[dict] = None
    auto_fetched: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = BaseSchema.model_config
