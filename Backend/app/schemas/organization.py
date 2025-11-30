from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.schemas.common import BaseSchema

class OrganizationBase(BaseSchema):
    name: str = Field(..., min_length=1, max_length=255)
    orgCode: str = Field(..., min_length=3, max_length=50)

class OrganizationCreate(OrganizationBase):
    password: str = Field(..., min_length=6)

class OrganizationOut(OrganizationBase):
    id: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True
