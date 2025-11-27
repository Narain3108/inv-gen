"""
Customization API Endpoints
"""

from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.db.models import Customization, Company
from app.schemas.customization import CustomizationCreate, CustomizationOut, CustomizationUpdate
from app.schemas.common import MessageResponse

router = APIRouter()


@router.post("/", response_model=CustomizationOut, status_code=status.HTTP_201_CREATED)
async def create_customization(
    customization_data: CustomizationCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create or update customization for a company"""
    # Verify company exists
    company_result = await db.execute(
        select(Company).where(Company.id == customization_data.company_id)
    )
    company = company_result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Check if customization already exists
    existing_result = await db.execute(
        select(Customization).where(
            Customization.company_id == customization_data.company_id,
            Customization.type == customization_data.type
        )
    )
    existing = existing_result.scalar_one_or_none()
    
    if existing:
        # Update existing
        existing.payload = customization_data.payload
        await db.flush()
        await db.refresh(existing)
        return existing
    else:
        # Create new
        customization = Customization(**customization_data.model_dump())
        db.add(customization)
        await db.flush()
        await db.refresh(customization)
        return customization


@router.get("/", response_model=CustomizationOut)
async def get_customization(
    company_id: UUID = Query(..., description="Company ID"),
    type: str = Query(..., description="Type: invoice or quotation"),
    db: AsyncSession = Depends(get_db)
):
    """Get customization for a company and type"""
    result = await db.execute(
        select(Customization).where(
            Customization.company_id == company_id,
            Customization.type == type
        )
    )
    customization = result.scalar_one_or_none()
    
    if not customization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customization not found"
        )
    
    return customization


@router.put("/{customization_id}", response_model=CustomizationOut)
async def update_customization(
    customization_id: UUID,
    customization_data: CustomizationUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update customization"""
    result = await db.execute(
        select(Customization).where(Customization.id == customization_id)
    )
    customization = result.scalar_one_or_none()
    
    if not customization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customization not found"
        )
    
    customization.payload = customization_data.payload
    await db.flush()
    await db.refresh(customization)
    
    return customization


@router.delete("/{customization_id}", response_model=MessageResponse)
async def delete_customization(
    customization_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete customization"""
    result = await db.execute(
        select(Customization).where(Customization.id == customization_id)
    )
    customization = result.scalar_one_or_none()
    
    if not customization:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customization not found"
        )
    
    await db.delete(customization)
    await db.flush()
    
    return MessageResponse(message="Customization deleted successfully")
