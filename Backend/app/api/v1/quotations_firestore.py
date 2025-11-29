"""
Firestore-based Quotations API
Quotations are nested under Companies: users/{uid}/companies/{cid}/quotations
"""

from fastapi import APIRouter, HTTPException, Depends, Query
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
class QuotationItemCreate(BaseModel):
    description: str
    hsn: Optional[str] = None
    quantity: float
    unit: Optional[str] = "Nos"
    unit_price: float = Field(..., alias="unitPrice")
    discount: float = 0
    gst_rate: float = Field(18.0, alias="gstRate")
    cess_rate: float = Field(0.0, alias="cessRate")
    product_id: Optional[str] = Field(None, alias="productId")
    item_code: Optional[str] = Field(None, alias="itemCode")
    serial_numbers: Optional[List[str]] = Field(None, alias="serialNumbers")
    
    # Calculated fields that might be sent
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None
    cess: Optional[float] = None
    line_total: Optional[float] = Field(None, alias="lineTotal")

    class Config:
        populate_by_name = True


class QuotationCreate(BaseModel):
    client_id: str = Field(..., alias="clientId")
    company_id: str = Field(..., alias="companyId") # Required for nesting
    quotation_number: Optional[str] = Field(None, alias="quotationNumber")
    date: Optional[str] = None
    valid_until: Optional[str] = Field(None, alias="validUntil")
    shipping_address: Optional[Dict[str, Any]] = Field(None, alias="shippingAddress")
    items: List[QuotationItemCreate]
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = "draft"
    
    # Totals
    total_amount: Optional[float] = Field(None, alias="totalAmount")
    total_amount_in_words: Optional[str] = Field(None, alias="totalAmountInWords")
    taxable_amount: Optional[float] = Field(None, alias="taxableAmount")
    cgst: Optional[float] = None
    sgst: Optional[float] = None
    igst: Optional[float] = None
    tax_breakdown: Optional[List[Dict[str, Any]]] = Field(None, alias="taxBreakdown")

    class Config:
        populate_by_name = True


class QuotationUpdate(BaseModel):
    client_id: Optional[str] = Field(None, alias="clientId")
    company_id: Optional[str] = Field(None, alias="companyId")
    quotation_number: Optional[str] = Field(None, alias="quotationNumber")
    date: Optional[str] = None
    valid_until: Optional[str] = Field(None, alias="validUntil")
    shipping_address: Optional[Dict[str, Any]] = Field(None, alias="shippingAddress")
    items: Optional[List[QuotationItemCreate]] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = None
    converted_to_invoice_id: Optional[str] = Field(None, alias="convertedToInvoiceId")
    
    class Config:
        populate_by_name = True


class QuotationOut(BaseModel):
    id: str
    company_id: Optional[str] = Field(None, alias="companyId")
    client_id: Optional[str] = Field(None, alias="clientId")
    quotation_number: Optional[str] = Field(None, alias="quotationNumber")
    date: Optional[str] = None
    valid_until: Optional[str] = Field(None, alias="validUntil")
    shipping_address: Optional[Dict[str, Any]] = Field(None, alias="shippingAddress")
    items: Optional[List[dict]] = None
    subtotal: Optional[float] = None
    tax_total: Optional[float] = Field(None, alias="taxTotal")
    grand_total: Optional[float] = Field(None, alias="grandTotal")
    total_amount: Optional[float] = Field(None, alias="totalAmount")
    total: Optional[float] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = None
    converted_to_invoice_id: Optional[str] = Field(None, alias="convertedToInvoiceId")
    created_at: Optional[str] = Field(None, alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")
    
    class Config:
        extra = "allow"
        populate_by_name = True


@router.post("", response_model=QuotationOut)
async def create_quotation(
    quotation: QuotationCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new quotation nested under a company"""
    try:
        db = get_firestore_db()
        
        quotation_data = quotation.dict(by_alias=True, exclude_unset=True)
        quotation_data["createdAt"] = datetime.utcnow()
        quotation_data["updatedAt"] = datetime.utcnow()
        quotation_data["user_id"] = user_id # Store user_id for collection group queries
        
        # Add to users/{uid}/companies/{cid}/quotations
        doc_ref = db.collection("users").document(user_id)\
            .collection("companies").document(quotation.company_id)\
            .collection("quotations").document()
            
        # Store ID in the document
        quotation_data["id"] = doc_ref.id
        
        doc_ref.set(quotation_data)
        
        return serialize_firestore_doc(quotation_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating quotation: {str(e)}")


@router.get("", response_model=List[QuotationOut])
async def get_quotations(
    company_id: Optional[str] = Query(None, alias="company_id"),
    companyId: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Get quotations. If company_id is provided, fetch from that company. Else fetch all user quotations."""
    try:
        db = get_firestore_db()
        quotations = []
        
        # Handle both snake_case and camelCase
        target_company_id = company_id or companyId
        
        if target_company_id:
            # Fetch from specific company
            quotations_ref = db.collection("users").document(user_id)\
                .collection("companies").document(target_company_id)\
                .collection("quotations")
            docs = quotations_ref.stream()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                quotations.append(serialize_firestore_doc(data))
        else:
            # Fetch all quotations for user using Collection Group Query
            quotations_query = db.collection_group("quotations").where("user_id", "==", user_id)
            docs = quotations_query.stream()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                quotations.append(serialize_firestore_doc(data))
            
        return quotations
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching quotations: {str(e)}")


@router.get("/{quotation_id}", response_model=QuotationOut)
async def get_quotation(
    quotation_id: str,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific quotation by ID. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        if company_id:
            # Direct lookup
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("quotations").document(quotation_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                raise HTTPException(status_code=404, detail="Quotation not found")
                
            quotation_data = doc.to_dict()
            if "id" not in quotation_data:
                quotation_data["id"] = doc.id
            return serialize_firestore_doc(quotation_data)
        else:
            # Use Collection Group Query
            query = db.collection_group("quotations")\
                .where("user_id", "==", user_id)\
                .where("id", "==", quotation_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Quotation not found")
                
            quotation_data = docs[0].to_dict()
            return serialize_firestore_doc(quotation_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{quotation_id}", response_model=QuotationOut)
async def update_quotation(
    quotation_id: str, 
    quotation_update: QuotationUpdate,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Update a quotation. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        doc_ref = None
        
        if company_id:
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("quotations").document(quotation_id)
                
            if not doc_ref.get().exists:
                raise HTTPException(status_code=404, detail="Quotation not found")
        else:
            # Find the quotation first
            query = db.collection_group("quotations")\
                .where("user_id", "==", user_id)\
                .where("id", "==", quotation_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Quotation not found")
                
            doc_ref = docs[0].reference
        
        update_data = quotation_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        quotation_data = updated_doc.to_dict()
        if "id" not in quotation_data:
            quotation_data["id"] = updated_doc.id
        return serialize_firestore_doc(quotation_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{quotation_id}", response_model=QuotationOut)
async def patch_quotation(
    quotation_id: str, 
    quotation_update: QuotationUpdate,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Partially update a quotation. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        doc_ref = None
        
        if company_id:
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("quotations").document(quotation_id)
                
            if not doc_ref.get().exists:
                raise HTTPException(status_code=404, detail="Quotation not found")
        else:
            # Find the quotation first
            query = db.collection_group("quotations")\
                .where("user_id", "==", user_id)\
                .where("id", "==", quotation_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Quotation not found")
                
            doc_ref = docs[0].reference
        
        update_data = quotation_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        quotation_data = updated_doc.to_dict()
        if "id" not in quotation_data:
            quotation_data["id"] = updated_doc.id
        return serialize_firestore_doc(quotation_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{quotation_id}")
async def delete_quotation(
    quotation_id: str,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Delete a quotation. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        doc_ref = None
        
        if company_id:
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("quotations").document(quotation_id)
                
            if not doc_ref.get().exists:
                raise HTTPException(status_code=404, detail="Quotation not found")
        else:
            # Find the quotation first
            query = db.collection_group("quotations")\
                .where("user_id", "==", user_id)\
                .where("id", "==", quotation_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Quotation not found")
                
            docs[0].reference.delete()

        if doc_ref:
            doc_ref.delete()
            
        return {"message": "Quotation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "requires an index" in error_msg:
             raise HTTPException(status_code=400, detail=f"Firestore query requires an index. Please provide 'companyId' query parameter for a direct lookup to avoid this error. Original error: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error deleting quotation: {error_msg}")

