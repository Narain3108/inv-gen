"""
User Pydantic Schemas
"""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import EmailStr, Field

from app.schemas.common import BaseSchema


class UserBase(BaseSchema):
    """Base user schema"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)


class UserCreate(UserBase):
    """Schema for creating a user"""
    photo_url: Optional[str] = None
    legacy_firebase_uid: Optional[str] = None


class UserUpdate(BaseSchema):
    """Schema for updating a user"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    photo_url: Optional[str] = None


class UserOut(UserBase):
    """Schema for user output"""
    id: UUID
    photo_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = BaseSchema.model_config
