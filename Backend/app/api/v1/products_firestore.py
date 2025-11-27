"""
Firestore-based Products API
Products is a GLOBAL collection
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
class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = None
    hsn: Optional[str] = None
    unit: str = "Nos"
    unit_price: float
    gst_rate: float = 18.0
    stock_quantity: Optional[int] = 0
    company_id: Optional[str] = None
    companyId: Optional[str] = None  # Accept both naming conventions


class ProductOut(BaseModel):
    id: str
    name: Optional[str] = None
    productName: Optional[str] = None
    description: Optional[str] = None
    hsn: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = None
    unitPrice: Optional[float] = None
    gst_rate: Optional[float] = None
    gstRate: Optional[float] = None
    stock_quantity: Optional[int] = None
    stockQuantity: Optional[int] = None
    category: Optional[str] = None
    price: Optional[float] = None
    company_id: Optional[str] = None
    companyId: Optional[str] = None
    created_at: Optional[str] = None
    createdAt: Optional[str] = None
    updated_at: Optional[str] = None
    updatedAt: Optional[str] = None
    
    class Config:
        extra = "allow"


@router.post("/", response_model=ProductOut)
async def create_product(product: ProductCreate):
    """Create a new product in Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        
        # Use either company_id or companyId
        company_id = product.company_id or product.companyId
        
        product_data = {
            "name": product.name,
            "description": product.description,
            "hsn": product.hsn,
            "unit": product.unit,
            "unit_price": product.unit_price,
            "gst_rate": product.gst_rate,
            "stock_quantity": product.stock_quantity or 0,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add companyId if provided (for frontend compatibility)
        if company_id:
            product_data["companyId"] = company_id
        
        timestamp, doc_ref = db.collection("products").add(product_data)
        product_id = doc_ref.id
        
        return {"id": product_id, **product_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")


@router.get("/", response_model=List[ProductOut])
async def list_products(skip: int = 0, limit: int = 50, company_id: Optional[str] = None):
    """Get all products from Firestore (Global Collection with optional company filter)"""
    try:
        db = get_firestore_db()
        
        query = db.collection("products")
        
        # Filter by company_id if provided (for frontend compatibility)
        if company_id:
            query = query.where("companyId", "==", company_id)
        
        query = query.limit(limit).offset(skip)
        products = []
        
        for doc in query.stream():
            product_data = doc.to_dict()
            products.append({"id": doc.id, **serialize_firestore_doc(product_data)})
        
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing products: {str(e)}")


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str):
    """Get a specific product from Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc = db.collection("products").document(product_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"id": doc.id, **serialize_firestore_doc(doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting product: {str(e)}")


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(product_id: str, product: ProductCreate):
    """Update a product in Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("products").document(product_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        update_data = {
            "name": product.name,
            "description": product.description,
            "hsn": product.hsn,
            "unit": product.unit,
            "unit_price": product.unit_price,
            "gst_rate": product.gst_rate,
            "stock_quantity": product.stock_quantity or 0,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")


@router.delete("/{product_id}")
async def delete_product(product_id: str):
    """Delete a product from Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("products").document(product_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Product not found")
        
        doc_ref.delete()
        return {"message": "Product deleted successfully", "id": product_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")
