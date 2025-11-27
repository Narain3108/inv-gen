"""
Company API Endpoints
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.db import get_db
from app.db.models import Company, User
from app.schemas.company import CompanyCreate, CompanyOut, CompanyUpdate
from app.schemas.common import MessageResponse, PaginationParams, PaginatedResponse

router = APIRouter()


@router.post("/", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
async def create_company(
    company_data: CompanyCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new company"""
    # Verify user exists
    user_result = await db.execute(
        select(User).where(User.id == company_data.user_id)
    )
    user = user_result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Create company
    company = Company(**company_data.model_dump())
    db.add(company)
    await db.flush()
    await db.refresh(company)
    
    return company


@router.get("/", response_model=PaginatedResponse[CompanyOut])
async def list_companies(
    user_id: Optional[UUID] = Query(None, description="Filter by user ID"),
    search: Optional[str] = Query(None, description="Search by name or GSTIN"),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List companies with optional filtering"""
    # Build query
    query = select(Company)
    
    # Apply filters
    if user_id:
        query = query.where(Company.user_id == user_id)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Company.name.ilike(search_pattern),
                Company.gstin.ilike(search_pattern)
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(pagination.skip).limit(pagination.limit)
    result = await db.execute(query)
    companies = result.scalars().all()
    
    return PaginatedResponse.create(
        items=companies,
        total=total,
        page=pagination.page,
        limit=pagination.limit
    )


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get company by ID"""
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    return company


@router.put("/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: UUID,
    company_data: CompanyUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update company"""
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Update fields
    update_data = company_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(company, field, value)
    
    await db.flush()
    await db.refresh(company)
    
    return company


@router.delete("/{company_id}", response_model=MessageResponse)
async def delete_company(
    company_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete company"""
    result = await db.execute(
        select(Company).where(Company.id == company_id)
    )
    company = result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    await db.delete(company)
    await db.flush()
    
    return MessageResponse(message="Company deleted successfully")
