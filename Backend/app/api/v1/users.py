"""
User API Endpoints
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.db.models import User
from app.schemas.user import UserCreate, UserOut, UserUpdate
from app.schemas.common import MessageResponse, PaginationParams, PaginatedResponse

router = APIRouter()


@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new user"""
    # Check if email already exists
    result = await db.execute(
        select(User).where(User.email == user_data.email)
    )
    existing_user = result.scalar_one_or_none()
    
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    user = User(**user_data.model_dump())
    db.add(user)
    await db.flush()
    await db.refresh(user)
    
    return user


@router.get("/", response_model=PaginatedResponse[UserOut])
async def list_users(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List all users with pagination"""
    # Get total count
    count_result = await db.execute(select(func.count(User.id)))
    total = count_result.scalar()
    
    # Get paginated users
    result = await db.execute(
        select(User)
        .offset(pagination.skip)
        .limit(pagination.limit)
    )
    users = result.scalars().all()
    
    return PaginatedResponse.create(
        items=users,
        total=total,
        page=pagination.page,
        limit=pagination.limit
    )


@router.get("/{user_id}", response_model=UserOut)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get user by ID"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.put("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update user"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update fields
    update_data = user_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
    
    await db.flush()
    await db.refresh(user)
    
    return user


@router.delete("/{user_id}", response_model=MessageResponse)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete user"""
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    await db.delete(user)
    await db.flush()
    
    return MessageResponse(message="User deleted successfully")
