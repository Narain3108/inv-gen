"""
Product API Endpoints
"""

from typing import List, Optional
from decimal import Decimal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.db.models import Product, Company, ProductCategory
from app.schemas.product import ProductCreate, ProductOut, ProductUpdate, ProductCategoryOut, ProductCategoryCreate, ProductCategoryUpdate
from app.schemas.common import MessageResponse, PaginationParams, PaginatedResponse

router = APIRouter()


# ==================== Product Endpoints ====================

@router.post("/", response_model=ProductOut, status_code=status.HTTP_201_CREATED)
async def create_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new product"""
    # Verify company exists
    company_result = await db.execute(
        select(Company).where(Company.id == product_data.company_id)
    )
    company = company_result.scalar_one_or_none()
    
    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found"
        )
    
    # Create product
    product = Product(**product_data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    
    return product


@router.get("/", response_model=PaginatedResponse[ProductOut])
async def list_products(
    company_id: Optional[UUID] = Query(None, description="Filter by company ID"),
    type: Optional[str] = Query(None, description="Filter by type (product/service)"),
    search: Optional[str] = Query(None, description="Search by name, HSN, or description"),
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List products with optional filtering"""
    # Build query
    query = select(Product)
    
    # Apply filters
    if company_id:
        query = query.where(Product.company_id == company_id)
    
    if type:
        query = query.where(Product.type == type)
    
    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                Product.product_name.ilike(search_pattern),
                Product.hsn.ilike(search_pattern),
                Product.description.ilike(search_pattern)
            )
        )
    
    # Get total count
    count_query = select(func.count()).select_from(query.subquery())
    count_result = await db.execute(count_query)
    total = count_result.scalar()
    
    # Get paginated results
    query = query.offset(pagination.skip).limit(pagination.limit).order_by(Product.product_name)
    result = await db.execute(query)
    products = result.scalars().all()
    
    return PaginatedResponse.create(
        items=products,
        total=total,
        page=pagination.page,
        limit=pagination.limit
    )


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get product by ID"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    return product


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: UUID,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update product"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    # Update fields
    update_data = product_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)
    
    await db.flush()
    await db.refresh(product)
    
    return product


@router.delete("/{product_id}", response_model=MessageResponse)
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete product"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    await db.delete(product)
    await db.flush()
    
    return MessageResponse(message="Product deleted successfully")


@router.post("/{product_id}/stock", response_model=ProductOut)
async def update_stock(
    product_id: UUID,
    quantity: int = Query(..., ge=0, description="New stock quantity"),
    db: AsyncSession = Depends(get_db)
):
    """Update product stock quantity"""
    result = await db.execute(
        select(Product).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )
    
    if product.type == "service":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot update stock for services"
        )
    
    product.stock = quantity
    await db.flush()
    await db.refresh(product)
    
    return product


# ==================== Product Category Endpoints ====================

@router.post("/categories", response_model=ProductCategoryOut, status_code=status.HTTP_201_CREATED)
async def create_product_category(
    category_data: ProductCategoryCreate,
    db: AsyncSession = Depends(get_db)
):
    """Create a new product category"""
    category = ProductCategory(**category_data.model_dump())
    db.add(category)
    await db.flush()
    await db.refresh(category)
    
    return category


@router.get("/categories", response_model=List[ProductCategoryOut])
async def list_product_categories(
    db: AsyncSession = Depends(get_db)
):
    """List all product categories"""
    result = await db.execute(
        select(ProductCategory).order_by(ProductCategory.category_name)
    )
    categories = result.scalars().all()
    
    return categories


@router.get("/categories/{category_id}", response_model=ProductCategoryOut)
async def get_product_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Get product category by ID"""
    result = await db.execute(
        select(ProductCategory).where(ProductCategory.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product category not found"
        )
    
    return category


@router.put("/categories/{category_id}", response_model=ProductCategoryOut)
async def update_product_category(
    category_id: UUID,
    category_data: ProductCategoryUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Update product category"""
    result = await db.execute(
        select(ProductCategory).where(ProductCategory.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product category not found"
        )
    
    # Update fields
    update_data = category_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(category, field, value)
    
    await db.flush()
    await db.refresh(category)
    
    return category


@router.delete("/categories/{category_id}", response_model=MessageResponse)
async def delete_product_category(
    category_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """Delete product category"""
    result = await db.execute(
        select(ProductCategory).where(ProductCategory.id == category_id)
    )
    category = result.scalar_one_or_none()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product category not found"
        )
    
    await db.delete(category)
    await db.flush()
    
    return MessageResponse(message="Product category deleted successfully")
