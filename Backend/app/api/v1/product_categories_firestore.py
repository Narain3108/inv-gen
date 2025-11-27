"""
Firestore-based Product Categories API
Product Categories is a SUBCOLLECTION under companies: companies/{companyId}/productCategories
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from app.core.firebase import get_firestore_db
from datetime import datetime

router = APIRouter()


def serialize_firestore_doc(doc_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Convert Firestore datetime objects to ISO format strings"""
    result = {}
    for key, value in doc_dict.items():
        if hasattr(value, 'isoformat'):  # datetime object
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
    name: str
    description: Optional[str] = None
    color: Optional[str] = "#6366f1"


class ProductCategoryOut(BaseModel):
    id: str
    company_id: Optional[str] = None
    companyId: Optional[str] = None
    name: Optional[str] = None
    categoryName: Optional[str] = None
    description: Optional[str] = None
    color: Optional[str] = None
    created_at: Optional[str] = None
    createdAt: Optional[str] = None
    updated_at: Optional[str] = None
    updatedAt: Optional[str] = None
    
    class Config:
        extra = "allow"


@router.post("/companies/{company_id}/product-categories", response_model=ProductCategoryOut)
async def create_product_category(company_id: str, category: ProductCategoryCreate):
    """Create a new product category in Firestore (Subcollection under company)"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        category_data = {
            "company_id": company_id,
            "name": category.name,
            "description": category.description,
            "color": category.color or "#6366f1",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add to subcollection: companies/{companyId}/productCategories
        timestamp, doc_ref = db.collection("companies").document(company_id)\
            .collection("productCategories").add(category_data)
        category_id = doc_ref.id
        
        return {"id": category_id, **category_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product category: {str(e)}")


@router.get("/companies/{company_id}/product-categories", response_model=List[ProductCategoryOut])
async def list_product_categories(company_id: str, skip: int = 0, limit: int = 50):
    """Get all product categories from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        query = db.collection("companies").document(company_id)\
            .collection("productCategories")\
            .order_by("name").limit(limit).offset(skip)
        
        categories = []
        for doc in query.stream():
            category_data = doc.to_dict()
            categories.append({"id": doc.id, **serialize_firestore_doc(category_data)})
        
        return categories
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing product categories: {str(e)}")


@router.get("/companies/{company_id}/product-categories/{category_id}", response_model=ProductCategoryOut)
async def get_product_category(company_id: str, category_id: str):
    """Get a specific product category from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc = db.collection("companies").document(company_id)\
            .collection("productCategories").document(category_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product category not found")
        
        return {"id": doc.id, **serialize_firestore_doc(doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting product category: {str(e)}")


@router.put("/companies/{company_id}/product-categories/{category_id}", response_model=ProductCategoryOut)
async def update_product_category(company_id: str, category_id: str, category: ProductCategoryCreate):
    """Update a product category in a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc_ref = db.collection("companies").document(company_id)\
            .collection("productCategories").document(category_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Product category not found")
        
        update_data = {
            "name": category.name,
            "description": category.description,
            "color": category.color or "#6366f1",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product category: {str(e)}")


@router.delete("/companies/{company_id}/product-categories/{category_id}")
async def delete_product_category(company_id: str, category_id: str):
    """Delete a product category from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc_ref = db.collection("companies").document(company_id)\
            .collection("productCategories").document(category_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Product category not found")
        
        doc_ref.delete()
        return {"message": "Product category deleted successfully", "id": category_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product category: {str(e)}")
