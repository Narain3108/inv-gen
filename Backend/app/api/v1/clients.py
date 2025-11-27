"""
Client API Endpoints
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.db.models import Client, Company
from app.schemas.client import ClientCreate, ClientOut, ClientUpdate
from app.schemas.common import MessageResponse, PaginationParams, PaginatedResponse

router = APIRouter()


@router.post("/", response_model=ClientOut, status_code=status.HTTP_201_CREATED)
async def create_client(
    client_data: ClientCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new client"""
    # If company_id is provided, verify it exists
    if client_data.company_id:
        company_result = await db.execute(
            select(Company).where(Company.id == client_data.company_id)
        )
        company = company_result.scalar_one_or_none()
        
        if not company:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Company not found"
            )
    
    # Create client
    client = Client(**client_data.model_dump())
    db.add(client)
    await db.flush()
    await db.refresh(client)
    
    return client


@router.get("/", response_model=PaginatedResponse[ClientOut])
async def list_clients(
    company_id: Optional[UUID] = Query(None, description="Filter by company ID"),
    search: Optional[str] = Query(None, description="Search by name, GSTIN, or PAN"),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List clients with optional filtering"""
    # Build query
    query = select(Client)
    
    # Apply filters
    if company_id:
        query = query.where(Client.company_id == company_id)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Client.client_name.ilike(search_pattern),
                Client.gstin.ilike(search_pattern),
                Client.pan.ilike(search_pattern)
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(pagination.skip).limit(pagination.limit).order_by(Client.client_name)
    result = await db.execute(query)
    clients = result.scalars().all()
    
    return PaginatedResponse.create(
        items=clients,
        total=total,
        page=pagination.page,
        limit=pagination.limit
    )


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get client by ID"""
    result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    return client


@router.put("/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update client"""
    result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    # Update fields
    update_data = client_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)
    
    await db.flush()
    await db.refresh(client)
    
    return client


@router.delete("/{client_id}", response_model=MessageResponse)
async def delete_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete client"""
    result = await db.execute(
        select(Client).where(Client.id == client_id)
    )
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Client not found"
        )
    
    await db.delete(client)
    await db.flush()
    
    return MessageResponse(message="Client deleted successfully")
