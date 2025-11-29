"""
Firestore-based Product Categories API
Product Categories are nested under Users: users/{uid}/product_categories
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.core.firebase import get_firestore_db
from app.core.deps import get_current_user_id
from datetime import datetime

router = APIRouter()


def serialize_firestore_doc(doc_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Firestore datetime objects to ISO format strings"""
    result = {}
    for key, value in doc_dict.items():
        if hasattr(value, "isoformat"):  # datetime object
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize_firestore_doc(value)
        elif isinstance(value, list):
            result[key] = [serialize_firestore_doc(item) if isinstance(item, dict) else item for item in value]
        else:
            result[key] = value
    return result


# Schemas
class ProductCategoryCreate(BaseModel):
    name: str = Field(..., alias="categoryName")
    description: Optional[str] = None
    products: Optional[List[Dict[str, Any]]] = None
    default_gst_rate: Optional[float] = Field(None, alias="defaultGstRate")
    color: Optional[str] = "#6366f1"

    class Config:
        populate_by_name = True


class ProductCategoryOut(BaseModel):
    id: str
    name: Optional[str] = Field(None, alias="categoryName")
    description: Optional[str] = None
    products: Optional[List[Dict[str, Any]]] = None
    default_gst_rate: Optional[float] = Field(None, alias="defaultGstRate")
    color: Optional[str] = None
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        extra = "allow"
        populate_by_name = True


@router.post("", response_model=ProductCategoryOut)
async def create_product_category(
    category: ProductCategoryCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new product category for the current user"""
    try:
        db = get_firestore_db()
        
        category_data = category.dict(by_alias=True, exclude_unset=True)
        category_data["created_at"] = datetime.utcnow().isoformat()
        category_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Add to user"s product_categories collection
        doc_ref = db.collection("users").document(user_id).collection("product_categories").document()
        doc_ref.set(category_data)
        
        # Return the created category
        category_data["id"] = doc_ref.id
        return serialize_firestore_doc(category_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product category: {str(e)}")


@router.get("", response_model=List[ProductCategoryOut])
async def list_product_categories(
    user_id: str = Depends(get_current_user_id)
):
    """Get all product categories for the current user"""
    try:
        db = get_firestore_db()
        categories_ref = db.collection("users").document(user_id).collection("product_categories")
        docs = categories_ref.stream()
        
        categories = []
        for doc in docs:
            category_data = doc.to_dict()
            category_data["id"] = doc.id
            categories.append(serialize_firestore_doc(category_data))
            
        return categories
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching product categories: {str(e)}")


@router.get("/{category_id}", response_model=ProductCategoryOut)
async def get_product_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific product category for the current user"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("users").document(user_id).collection("product_categories").document(category_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product category not found")
            
        category_data = doc.to_dict()
        category_data["id"] = doc.id
        return serialize_firestore_doc(category_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching product category: {str(e)}")


@router.put("/{category_id}", response_model=ProductCategoryOut)
async def update_product_category(
    category_id: str,
    category_update: ProductCategoryCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a product category for the current user"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("users").document(user_id).collection("product_categories").document(category_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Product category not found")
            
        update_data = category_update.dict(by_alias=True, exclude_unset=True)
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        category_data = updated_doc.to_dict()
        category_data["id"] = updated_doc.id
        return serialize_firestore_doc(category_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product category: {str(e)}")


@router.delete("/{category_id}")
async def delete_product_category(
    category_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a product category for the current user"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("users").document(user_id).collection("product_categories").document(category_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Product category not found")
            
        doc_ref.delete()
        return {"message": "Product category deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product category: {str(e)}")

