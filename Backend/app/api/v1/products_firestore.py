"""
Firestore-based Products API
Products are nested under Companies: users/{uid}/companies/{cid}/products
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any, Annotated
from pydantic import BaseModel, Field, BeforeValidator
from app.core.firebase import get_firestore_db
from app.core.deps import get_current_user
from datetime import datetime

router = APIRouter()

def parse_float_or_zero(v: Any) -> float:
    if v == "" or v is None:
        return 0.0
    return v

def parse_float_or_none(v: Any) -> Optional[float]:
    if v == "" or v is None:
        return None
    return v


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
class ProductCreate(BaseModel):
    name: str = Field(..., alias="productName")
    description: Optional[str] = None
    hsn: Optional[str] = None
    unit: str = "Nos"
    unit_price: float = Field(..., alias="price")
    gst_rate: float = Field(18.0, alias="gstRate")
    cess_rate: Annotated[Optional[float], BeforeValidator(parse_float_or_zero)] = Field(0.0, alias="cessRate")
    stock_quantity: Annotated[Optional[float], BeforeValidator(parse_float_or_zero)] = Field(0.0, alias="stock")
    company_id: str = Field(..., alias="companyId") # Required for nesting
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
    cess_rate: Annotated[Optional[float], BeforeValidator(parse_float_or_none)] = Field(None, alias="cessRate")
    stock_quantity: Annotated[Optional[float], BeforeValidator(parse_float_or_none)] = Field(None, alias="stock")
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
    stock_quantity: Optional[float] = Field(None, alias="stock")
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
async def create_product(
    product: ProductCreate,
    user: Dict = Depends(get_current_user)
):
    """Create a new product"""
    try:
        db = get_firestore_db()
        
        # Verify Company Access
        if user.get("role") != "super_admin" and product.company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied to this company")

        product_data = product.dict(by_alias=True, exclude_unset=True)
        product_data["createdAt"] = datetime.utcnow()
        product_data["updatedAt"] = datetime.utcnow()
        product_data["createdBy"] = user.get("id")
        
        # Add to global products collection
        doc_ref = db.collection("products").document()
        doc_ref.set(product_data)
        
        # Return the created product
        product_data["id"] = doc_ref.id
        return serialize_firestore_doc(product_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")


@router.get("", response_model=List[ProductOut])
async def get_products(
    company_id: Optional[str] = Query(None, alias="company_id"),
    companyId: Optional[str] = Query(None, alias="companyId"),
    user: Dict = Depends(get_current_user)
):
    """Get products. If company_id is provided, fetch from that company. Else fetch all accessible products."""
    try:
        db = get_firestore_db()
        products = []
        
        # Handle both snake_case and camelCase
        target_company_id = company_id or companyId
        
        # Determine accessible company IDs
        allowed_companies = user.get("allowedCompanyIds", [])
        
        query = db.collection("products")
        
        if target_company_id:
            # Verify access
            if user.get("role") != "super_admin" and target_company_id not in allowed_companies:
                 raise HTTPException(status_code=403, detail="Access denied to this company")
            query = query.where("companyId", "==", target_company_id)
        else:
            # If no company specified, filter by allowed companies
            if user.get("role") != "super_admin":
                if not allowed_companies:
                    return []
                if len(allowed_companies) > 0:
                     query = query.where("companyId", "in", allowed_companies[:10]) # Limit to 10 for safety
            
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            products.append(serialize_firestore_doc(data))
            
        return products
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching products: {str(e)}")


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get a specific product"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("products").document(product_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
            
        product_data = doc.to_dict()
        
        # Verify Access
        company_id = product_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")

        product_data["id"] = doc.id
        return serialize_firestore_doc(product_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching product: {str(e)}")


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str, 
    product_update: ProductUpdate,
    user: Dict = Depends(get_current_user)
):
    """Update a product"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("products").document(product_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
            
        product_data = doc.to_dict()
        
        # Verify Access
        company_id = product_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")

        update_data = product_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        product_data = updated_doc.to_dict()
        product_data["id"] = updated_doc.id
        return serialize_firestore_doc(product_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating product: {str(e)}")


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    user: Dict = Depends(get_current_user)
):
    """Delete a product"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("products").document(product_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Product not found")
            
        product_data = doc.to_dict()
        
        # Verify Access
        company_id = product_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")
        
        doc_ref.delete()
        
        return {"message": "Product deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting product: {str(e)}")

