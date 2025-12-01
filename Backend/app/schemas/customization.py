"""
Customization Pydantic Schemas
"""

from datetime import datetime
from typing import Literal, Optional
from uuid import UUID

from pydantic import Field

from app.schemas.common import BaseSchema


class CustomizationBase(BaseSchema):
    """Base customization schema"""
    type: Literal["invoice", "quotation"]
    payload: dict = Field(..., description="Full customization configuration as JSON")


class CustomizationCreate(CustomizationBase):
    """Schema for creating customization"""
    company_id: UUID


class CustomizationUpdate(BaseSchema):
    """Schema for updating customization"""
    payload: dict


class CustomizationOut(CustomizationBase):
    """Schema for customization output"""
    id: UUID
    company_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = BaseSchema.model_config
