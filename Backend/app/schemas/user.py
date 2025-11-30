"""
User Pydantic Schemas
"""

from datetime import datetime
from typing import Optional, List
from enum import Enum
from uuid import UUID

from pydantic import EmailStr, Field

from app.schemas.common import BaseSchema

class UserRole(str, Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    EMPLOYEE = "employee"

class UserBase(BaseSchema):
    """Base user schema"""
    email: EmailStr
    name: str = Field(..., min_length=1, max_length=255)
    role: UserRole = UserRole.EMPLOYEE
    organizationId: str
    allowedCompanyIds: List[str] = []

class UserCreate(UserBase):
    """Schema for creating a user"""
    password: str
    photo_url: Optional[str] = None
    legacy_firebase_uid: Optional[str] = None

class UserUpdate(BaseSchema):
    """Schema for updating a user"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    photo_url: Optional[str] = None
    role: Optional[UserRole] = None
    allowedCompanyIds: Optional[List[str]] = None

class UserOut(UserBase):
    """Schema for user output"""
    id: str
    photo_url: Optional[str] = None
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    
    model_config = BaseSchema.model_config
