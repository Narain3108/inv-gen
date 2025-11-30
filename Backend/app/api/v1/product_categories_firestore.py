"""
Firestore-based Product Categories API
Product Categories are stored in a global 'product_categories' collection with 'companyId' field.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.core.firebase import get_firestore_db
from app.core.deps import get_current_user
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
    company_id: Optional[str] = Field(None, alias="companyId")

    class Config:
        populate_by_name = True


class ProductCategoryOut(BaseModel):
    id: str
    name: Optional[str] = Field(None, alias="categoryName")
    description: Optional[str] = None
    products: Optional[List[Dict[str, Any]]] = None
    default_gst_rate: Optional[float] = Field(None, alias="defaultGstRate")
    color: Optional[str] = None
    company_id: Optional[str] = Field(None, alias="companyId")
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
    
    class Config:
        extra = "allow"
        populate_by_name = True


@router.post("", response_model=ProductCategoryOut)
async def create_product_category(
    category: ProductCategoryCreate,
    user: Dict = Depends(get_current_user)
):
    """Create a new product category"""
    try:
        db = get_firestore_db()
        
        category_data = category.dict(by_alias=True, exclude_unset=True)
        
        # Verify Access
        company_id = category_data.get("companyId")
        if not company_id:
             # If no companyId, maybe it's a global category or user didn't provide it.
             # For now, let's require companyId or default to first allowed company?
             # Better to require it if we are strict about organization.
             # But for backward compatibility, maybe we can allow it if we infer it?
             # Let's require it for now.
             raise HTTPException(status_code=400, detail="companyId is required")
             
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied to this company")

        category_data["created_at"] = datetime.utcnow().isoformat()
        category_data["updated_at"] = datetime.utcnow().isoformat()
        category_data["createdBy"] = user.get("id")
        
        # Add to global product_categories collection
        doc_ref = db.collection("product_categories").document()
        doc_ref.set(category_data)
        
        # Return the created category
        category_data["id"] = doc_ref.id
        return serialize_firestore_doc(category_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product category: {str(e)}")


@router.get("", response_model=List[ProductCategoryOut])
async def list_product_categories(
    company_id: Optional[str] = Query(None, alias="companyId"),
    user: Dict = Depends(get_current_user)
):
    """Get product categories. If companyId is provided, fetch from that company. Else fetch all accessible categories."""
    try:
        db = get_firestore_db()
        categories = []
        
        # Determine accessible company IDs
        allowed_companies = user.get("allowedCompanyIds", [])
        
        query = db.collection("product_categories")
        
        if company_id:
            # Verify access
            if user.get("role") != "super_admin" and company_id not in allowed_companies:
                 raise HTTPException(status_code=403, detail="Access denied to this company")
            query = query.where("companyId", "==", company_id)
        else:
            # If no company specified, filter by allowed companies
            if user.get("role") != "super_admin":
                if not allowed_companies:
                    return []
                if len(allowed_companies) > 0:
                     query = query.where("companyId", "in", allowed_companies[:10]) # Limit to 10 for safety
            
        docs = query.stream()
        for doc in docs:
            category_data = doc.to_dict()
            category_data["id"] = doc.id
            categories.append(serialize_firestore_doc(category_data))
            
        return categories
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching product categories: {str(e)}")


@router.get("/{category_id}", response_model=ProductCategoryOut)
async def get_product_category(
    category_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get a specific product category by ID"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("product_categories").document(category_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product category not found")
            
        category_data = doc.to_dict()
        
        # Verify Access
        company_id = category_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")
             
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
    user: Dict = Depends(get_current_user)
):
    """Update a product category"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("product_categories").document(category_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product category not found")
            
        category_data = doc.to_dict()
        
        # Verify Access
        company_id = category_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")

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
    user: Dict = Depends(get_current_user)
):
    """Delete a product category"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("product_categories").document(category_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product category not found")
            
        category_data = doc.to_dict()
        
        # Verify Access
        company_id = category_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")
        
        doc_ref.delete()
        return {"message": "Product category deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product category: {str(e)}")

