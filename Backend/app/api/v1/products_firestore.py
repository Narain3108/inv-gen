"""
Firestore-based Products API
Products are nested under Companies: users/{uid}/companies/{cid}/products
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Optional, Dict, Any, Annotated
from pydantic import BaseModel, Field, BeforeValidator
from app.core.firebase import get_firestore_db
from app.core.deps import get_current_user_id
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
    user_id: str = Depends(get_current_user_id)
):
    """Create a new product nested under a company"""
    try:
        db = get_firestore_db()
        
        product_data = product.dict(by_alias=True, exclude_unset=True)
        product_data["createdAt"] = datetime.utcnow()
        product_data["updatedAt"] = datetime.utcnow()
        product_data["user_id"] = user_id # Store user_id for collection group queries
        
        # Add to users/{uid}/companies/{cid}/products
        doc_ref = db.collection("users").document(user_id)\
            .collection("companies").document(product.company_id)\
            .collection("products").document()
            
        # Store ID in the document for easier querying
        product_data["id"] = doc_ref.id
        
        doc_ref.set(product_data)
        
        return serialize_firestore_doc(product_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating product: {str(e)}")


@router.get("", response_model=List[ProductOut])
async def get_products(
    company_id: Optional[str] = Query(None, alias="company_id"),
    companyId: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Get products. If company_id is provided, fetch from that company. Else fetch all user products."""
    try:
        db = get_firestore_db()
        products = []
        
        # Handle both snake_case and camelCase
        target_company_id = company_id or companyId
        
        if target_company_id:
            # Fetch from specific company
            products_ref = db.collection("users").document(user_id)\
                .collection("companies").document(target_company_id)\
                .collection("products")
            docs = products_ref.stream()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                products.append(serialize_firestore_doc(data))
        else:
            # Fetch all products for user using Collection Group Query
            # Note: This requires an index on `user_id`
            products_query = db.collection_group("products").where("user_id", "==", user_id)
            docs = products_query.stream()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                products.append(serialize_firestore_doc(data))
            
        return products
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching products: {str(e)}")


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(
    product_id: str,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific product by ID. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        if company_id:
            # Direct lookup (No index required)
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("products").document(product_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                raise HTTPException(status_code=404, detail="Product not found")
            
            product_data = doc.to_dict()
            # Ensure ID is in data
            if "id" not in product_data:
                product_data["id"] = doc.id
            return serialize_firestore_doc(product_data)
            
        else:
            # Use Collection Group Query (Requires Index)
            query = db.collection_group("products")\
                .where("user_id", "==", user_id)\
                .where("id", "==", product_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Product not found")
                
            product_data = docs[0].to_dict()
            return serialize_firestore_doc(product_data)
        
    except HTTPException:
        raise
    except Exception as e:
        # Return the actual error message which might contain the index creation link
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str, 
    product_update: ProductUpdate,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Update a product. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        doc_ref = None
        
        if company_id:
            # Direct lookup
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("products").document(product_id)
            
            if not doc_ref.get().exists:
                raise HTTPException(status_code=404, detail="Product not found")
        else:
            # Find the product first to get its reference (Requires Index)
            query = db.collection_group("products")\
                .where("user_id", "==", user_id)\
                .where("id", "==", product_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Product not found")
                
            doc_ref = docs[0].reference
        
        update_data = product_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        product_data = updated_doc.to_dict()
        if "id" not in product_data:
            product_data["id"] = updated_doc.id
        return serialize_firestore_doc(product_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}")
async def delete_product(
    product_id: str,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Delete a product. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        doc_ref = None
        
        if company_id:
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("products").document(product_id)
                
            if not doc_ref.get().exists:
                raise HTTPException(status_code=404, detail="Product not found")
        else:
            # Find the product first (Requires Index)
            query = db.collection_group("products")\
                .where("user_id", "==", user_id)\
                .where("id", "==", product_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Product not found")
                
            doc_ref = docs[0].reference

        doc_ref.delete()
        return {"message": "Product deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "requires an index" in error_msg:
             raise HTTPException(status_code=400, detail=f"Firestore query requires an index. Please provide 'companyId' query parameter for a direct lookup to avoid this error. Original error: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error deleting product: {error_msg}")

