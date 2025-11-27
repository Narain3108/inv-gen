"""
Common Pydantic schemas and utilities
"""

from datetime import datetime
from typing import Generic, List, Optional, TypeVar
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


# ==================== Base Schemas ====================

class BaseSchema(BaseModel):
    """Base schema with common configuration"""
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        use_enum_values=True,
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None
        }
    )


# ==================== Pagination ====================

class PaginationParams(BaseModel):
    """Pagination query parameters"""
    page: int = Field(default=1, ge=1, description="Page number starting from 1")
    limit: int = Field(default=50, ge=1, le=1000, description="Items per page")
    
    @property
    def skip(self) -> int:
        """Calculate offset for database query"""
        return (self.page - 1) * self.limit


T = TypeVar("T")

class PaginatedResponse(BaseSchema, Generic[T]):
    """Generic paginated response wrapper"""
    items: List[T]
    total: int
    page: int
    limit: int
    pages: int
    
    @classmethod
    def create(cls, items: List[T], total: int, page: int, limit: int):
        """Create paginated response"""
        pages = (total + limit - 1) // limit  # Ceiling division
        return cls(
            items=items,
            total=total,
            page=page,
            limit=limit,
            pages=pages
        )


# ==================== Nested Schemas ====================

class AddressSchema(BaseSchema):
    """Address structure"""
    street: str
    city: str
    state: str
    pincode: str
    country: Optional[str] = "India"


class ContactSchema(BaseSchema):
    """Contact information"""
    phone: str
    email: str
    website: Optional[str] = None


class BankDetailsSchema(BaseSchema):
    """Bank account details"""
    bank_name: str
    account_number: str
    ifsc_code: str
    account_holder_name: str
    branch: Optional[str] = None
    upi_id: Optional[str] = None


class NumberingConfigSchema(BaseSchema):
    """Invoice/Quotation numbering configuration"""
    prefix: str = ""
    suffix: str = ""
    order: str = "prefix-number-suffix"
    next_number: int = 1


# ==================== Response Wrappers ====================

class MessageResponse(BaseSchema):
    """Simple message response"""
    message: str
    success: bool = True


class IDResponse(BaseSchema):
    """Response with created resource ID"""
    id: UUID
    message: str
    success: bool = True
