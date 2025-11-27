"""
Product Pydantic Schemas
"""

from datetime import datetime
from decimal import Decimal
from typing import Optional, Literal
from uuid import UUID

from pydantic import Field

from app.schemas.common import BaseSchema


class ProductBase(BaseSchema):
    """Base product schema"""
    product_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    item_code: Optional[str] = Field(None, max_length=50)
    hsn: str = Field(..., max_length=20)
    unit: str = Field(..., max_length=50)
    price: Decimal = Field(..., ge=0, decimal_places=2)
    gst_rate: Decimal = Field(..., ge=0, le=100, decimal_places=2)
    cess_rate: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)
    type: Literal["product", "service"] = "product"
    has_serial_number: bool = False


class ProductCreate(ProductBase):
    """Schema for creating a product"""
    company_id: UUID
    category_id: Optional[UUID] = None
    stock: Optional[int] = Field(None, ge=0)


class ProductUpdate(BaseSchema):
    """Schema for updating a product"""
    product_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    item_code: Optional[str] = Field(None, max_length=50)
    hsn: Optional[str] = Field(None, max_length=20)
    unit: Optional[str] = Field(None, max_length=50)
    price: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    gst_rate: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)
    cess_rate: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)
    stock: Optional[int] = Field(None, ge=0)
    type: Optional[Literal["product", "service"]] = None
    has_serial_number: Optional[bool] = None
    category_id: Optional[UUID] = None


class ProductOut(ProductBase):
    """Schema for product output"""
    id: UUID
    company_id: UUID
    category_id: Optional[UUID] = None
    stock: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = BaseSchema.model_config


class ProductCategoryBase(BaseSchema):
    """Base product category schema"""
    category_name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    default_gst_rate: Decimal = Field(..., ge=0, le=100, decimal_places=2)


class ProductCategoryCreate(ProductCategoryBase):
    """Schema for creating a product category"""
    products: Optional[dict] = None  # JSONB data


class ProductCategoryUpdate(BaseSchema):
    """Schema for updating a product category"""
    category_name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    default_gst_rate: Optional[Decimal] = Field(None, ge=0, le=100, decimal_places=2)
    products: Optional[dict] = None


class ProductCategoryOut(ProductCategoryBase):
    """Schema for product category output"""
    id: UUID
    products: Optional[dict] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = BaseSchema.model_config
