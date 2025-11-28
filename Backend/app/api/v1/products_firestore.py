"""
Firestore-based Products API
Products is a GLOBAL collection
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
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
    name: str = Field(..., alias="productName")
    description: Optional[str] = None
    hsn: Optional[str] = None
    unit: str = "Nos"
    unit_price: float = Field(..., alias="price")
    gst_rate: float = Field(18.0, alias="gstRate")
    cess_rate: Optional[float] = Field(0.0, alias="cessRate")
    stock_quantity: Optional[int] = Field(0, alias="stock")
    company_id: Optional[str] = Field(None, alias="companyId")
    item_code: Optional[str] = Field(None, alias="itemCode")
    type: Optional[str] = "product"
    has_serial_number: Optional[bool] = Field(False, alias="hasSerialNumber")
    category_id: Optional[str] = Field(None, alias="categoryId")

    class Config:
        populate_by_name = True


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, alias="productName")
    description: Optional[str] = None
    hsn: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = Field(None, alias="price")
    gst_rate: Optional[float] = Field(None, alias="gstRate")
    cess_rate: Optional[float] = Field(None, alias="cessRate")
    stock_quantity: Optional[int] = Field(None, alias="stock")
    company_id: Optional[str] = Field(None, alias="companyId")
    item_code: Optional[str] = Field(None, alias="itemCode")
    type: Optional[str] = None
    has_serial_number: Optional[bool] = Field(None, alias="hasSerialNumber")
    category_id: Optional[str] = Field(None, alias="categoryId")

    class Config:
        populate_by_name = True


class ProductOut(BaseModel):
    id: str
    name: Optional[str] = Field(None, alias="productName")
    description: Optional[str] = None
    hsn: Optional[str] = None
    unit: Optional[str] = None
    unit_price: Optional[float] = Field(None, alias="price")
    gst_rate: Optional[float] = Field(None, alias="gstRate")
    cess_rate: Optional[float] = Field(None, alias="cessRate")
    stock_quantity: Optional[int] = Field(None, alias="stock")
    category: Optional[str] = None
    company_id: Optional[str] = Field(None, alias="companyId")
    item_code: Optional[str] = Field(None, alias="itemCode")
    type: Optional[str] = None
    has_serial_number: Optional[bool] = Field(None, alias="hasSerialNumber")
    category_id: Optional[str] = Field(None, alias="categoryId")
    created_at: Optional[str] = Field(None, alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")
    
    class Config:
        extra = "allow"
        populate_by_name = True


@router.post("", response_model=ProductOut)
async def create_product(product: ProductCreate):
    """Create a new product in Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        
        # Use either company_id or companyId
        company_id = product.company_id
        
        product_data = {
            "name": product.name,
            "description": product.description,
            "hsn": product.hsn,
            "unit": product.unit,
            "unit_price": product.unit_price,
            "gst_rate": product.gst_rate,
            "cess_rate": product.cess_rate,
            "stock_quantity": product.stock_quantity or 0,
            "item_code": product.item_code,
            "type": product.type,
            "has_serial_number": product.has_serial_number,
            "category_id": product.category_id,
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


@router.get("", response_model=List[ProductOut])
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
async def update_product(product_id: str, product: ProductUpdate):
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
            "cess_rate": product.cess_rate,
            "stock_quantity": product.stock_quantity or 0,
            "item_code": product.item_code,
            "type": product.type,
            "has_serial_number": product.has_serial_number,
            "category_id": product.category_id,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if product.company_id:
            update_data["companyId"] = product.company_id
            
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")


@router.patch("/{product_id}", response_model=ProductOut)
async def patch_product(product_id: str, product: ProductUpdate):
    """Partially update a product in Firestore"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("products").document(product_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Product not found")
            
        # Get set fields (snake_case keys match Firestore keys for products)
        data = product.model_dump(exclude_unset=True)
        
        update_data = {}
        for k, v in data.items():
            if k == "company_id":
                update_data["companyId"] = v
            else:
                update_data[k] = v

        if not update_data:
             return {"id": product_id, **serialize_firestore_doc(doc_ref.get().to_dict())}

        update_data["updated_at"] = datetime.utcnow().isoformat()
        
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
