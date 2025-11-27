"""
Firestore-based Quotations API
Quotations is a SUBCOLLECTION under companies: companies/{companyId}/quotations
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
class QuotationItemCreate(BaseModel):
    description: str
    hsn: Optional[str] = None
    quantity: float
    unit: Optional[str] = "Nos"
    unit_price: float
    discount: float = 0
    gst_rate: float = 18.0
    product_id: Optional[str] = None


class QuotationCreate(BaseModel):
    client_id: str
    company_id: Optional[str] = None
    companyId: Optional[str] = None
    quotation_number: Optional[str] = None
    date: Optional[str] = None
    quotation_date: Optional[str] = None
    valid_until: Optional[str] = None
    items: List[QuotationItemCreate]
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = "draft"


class QuotationOut(BaseModel):
    id: str
    company_id: Optional[str] = None
    companyId: Optional[str] = None
    client_id: Optional[str] = None
    clientId: Optional[str] = None
    quotation_number: Optional[str] = None
    quotationNumber: Optional[str] = None
    date: Optional[str] = None
    valid_until: Optional[str] = None
    validUntil: Optional[str] = None
    items: Optional[List[dict]] = None
    subtotal: Optional[float] = None
    tax_total: Optional[float] = None
    taxTotal: Optional[float] = None
    grand_total: Optional[float] = None
    grandTotal: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[str] = None
    createdAt: Optional[str] = None
    updated_at: Optional[str] = None
    updatedAt: Optional[str] = None
    
    class Config:
        extra = "allow"


def calculate_quotation_totals(items: List[QuotationItemCreate]) -> dict:
    """Calculate quotation totals with GST"""
    subtotal = 0
    tax_total = 0
    
    calculated_items = []
    for item in items:
        item_total = (item.quantity * item.unit_price) - item.discount
        item_tax = item_total * (item.gst_rate / 100)
        
        subtotal += item_total
        tax_total += item_tax
        
        calculated_items.append({
            "description": item.description,
            "hsn": item.hsn,
            "quantity": item.quantity,
            "unit": item.unit,
            "unit_price": item.unit_price,
            "discount": item.discount,
            "gst_rate": item.gst_rate,
            "item_total": item_total,
            "tax_amount": item_tax,
            "total_with_tax": item_total + item_tax
        })
    
    return {
        "items": calculated_items,
        "subtotal": subtotal,
        "tax_total": tax_total,
        "grand_total": subtotal + tax_total
    }


@router.get("/quotations", response_model=List[QuotationOut])
async def list_all_quotations(
    company_id: Optional[str] = None,
    client_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get quotations from top-level collection filtered by companyId (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        
        query_ref = db.collection("quotations")
        
        if company_id:
            query_ref = query_ref.where("companyId", "==", company_id)
        
        if client_id:
            query_ref = query_ref.where("clientId", "==", client_id)
        
        # Note: orderBy removed to avoid composite index requirement
        # Frontend should handle sorting if needed
        query_ref = query_ref.limit(limit).offset(skip)
        quotations = []
        
        for doc in query_ref.stream():
            quotation_data = doc.to_dict()
            quotations.append({"id": doc.id, **serialize_firestore_doc(quotation_data)})
        
        return quotations
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing quotations: {str(e)}")


@router.post("/quotations", response_model=QuotationOut)
async def create_quotation_toplevel(quotation: QuotationCreate):
    """Create quotation in top-level collection (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        
        # Extract company_id from request
        company_id = getattr(quotation, 'company_id', None) or getattr(quotation, 'companyId', None)
        if not company_id:
            raise HTTPException(status_code=400, detail="company_id or companyId is required")
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Calculate totals
        calculations = calculate_quotation_totals(quotation.items)
        
        # Generate quotation number
        # Get all quotations for company and find max number (avoid composite index)
        all_quotations = db.collection("quotations")\
            .where("companyId", "==", company_id)\
            .stream()
        
        last_num = 0
        for doc in all_quotations:
            quotation_data = doc.to_dict()
            if quotation_data.get("quotationNumber"):
                try:
                    num = int(quotation_data["quotationNumber"].split("-")[-1])
                    if num > last_num:
                        last_num = num
                except:
                    pass
        
        quotation_number = f"QUO-{str(last_num + 1).zfill(3)}"
        quotation_date = quotation.date or quotation.quotation_date or datetime.utcnow().strftime("%Y-%m-%d")
        
        quotation_data = {
            "companyId": company_id,
            "clientId": quotation.client_id,
            "quotationNumber": quotation_number,
            "date": quotation_date,
            "validUntil": quotation.valid_until,
            "items": calculations["items"],
            "subtotal": calculations["subtotal"],
            "taxTotal": calculations["tax_total"],
            "grandTotal": calculations["grand_total"],
            "notes": quotation.notes,
            "terms": quotation.terms,
            "status": quotation.status or "pending",
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        timestamp, doc_ref = db.collection("quotations").add(quotation_data)
        quotation_id = doc_ref.id
        
        return {"id": quotation_id, **quotation_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating quotation: {str(e)}")


@router.get("/quotations/{quotation_id}", response_model=QuotationOut)
async def get_quotation_toplevel(quotation_id: str):
    """Get single quotation from top-level collection (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        doc = db.collection("quotations").document(quotation_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
        
        return {"id": doc.id, **serialize_firestore_doc(doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting quotation: {str(e)}")


@router.put("/quotations/{quotation_id}", response_model=QuotationOut)
async def update_quotation_toplevel(quotation_id: str, quotation: QuotationCreate):
    """Update quotation in top-level collection (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("quotations").document(quotation_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
        
        calculations = calculate_quotation_totals(quotation.items)
        quotation_date = quotation.date or quotation.quotation_date or datetime.utcnow().strftime("%Y-%m-%d")
        
        update_data = {
            "clientId": quotation.client_id,
            "date": quotation_date,
            "validUntil": quotation.valid_until,
            "items": calculations["items"],
            "subtotal": calculations["subtotal"],
            "taxTotal": calculations["tax_total"],
            "grandTotal": calculations["grand_total"],
            "notes": quotation.notes,
            "terms": quotation.terms,
            "status": quotation.status or "pending",
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating quotation: {str(e)}")


@router.delete("/quotations/{quotation_id}")
async def delete_quotation_toplevel(quotation_id: str):
    """Delete quotation from top-level collection (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("quotations").document(quotation_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
        
        doc_ref.delete()
        return {"message": "Quotation deleted successfully", "id": quotation_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting quotation: {str(e)}")


@router.post("/companies/{company_id}/quotations", response_model=QuotationOut)
async def create_quotation(company_id: str, quotation: QuotationCreate):
    """Create a new quotation in Firestore (Subcollection under company)"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Calculate totals
        calculations = calculate_quotation_totals(quotation.items)
        
        # Generate quotation number if not provided
        quotation_number = quotation.quotation_number
        if not quotation_number:
            # Get last quotation number for this company
            last_quotation = db.collection("companies").document(company_id)\
                .collection("quotations")\
                .order_by("created_at", direction="DESCENDING")\
                .limit(1)\
                .stream()
            
            last_num = 0
            for doc in last_quotation:
                last_quotation_data = doc.to_dict()
                if last_quotation_data.get("quotation_number"):
                    try:
                        last_num = int(last_quotation_data["quotation_number"].split("-")[-1])
                    except:
                        pass
            
            quotation_number = f"QUO-{str(last_num + 1).zfill(3)}"
        
        # Use either date or quotation_date field
        quotation_date = quotation.date or quotation.quotation_date or datetime.utcnow().strftime("%Y-%m-%d")
        
        quotation_data = {
            "company_id": company_id,
            "client_id": quotation.client_id,
            "quotation_number": quotation_number,
            "date": quotation_date,
            "valid_until": quotation.valid_until,
            "items": calculations["items"],
            "subtotal": calculations["subtotal"],
            "tax_total": calculations["tax_total"],
            "grand_total": calculations["grand_total"],
            "notes": quotation.notes,
            "terms": quotation.terms,
            "status": quotation.status or "pending",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add to subcollection: companies/{companyId}/quotations
        timestamp, doc_ref = db.collection("companies").document(company_id)\
            .collection("quotations").add(quotation_data)
        quotation_id = doc_ref.id
        
        return {"id": quotation_id, **quotation_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating quotation: {str(e)}")


@router.get("/companies/{company_id}/quotations", response_model=List[QuotationOut])
async def list_quotations(
    company_id: str,
    client_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get all quotations from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        query = db.collection("companies").document(company_id).collection("quotations")
        
        if client_id:
            query = query.where("client_id", "==", client_id)
        
        query = query.order_by("created_at", direction="DESCENDING").limit(limit).offset(skip)
        quotations = []
        
        for doc in query.stream():
            quotation_data = doc.to_dict()
            quotations.append({"id": doc.id, **serialize_firestore_doc(quotation_data)})
        
        return quotations
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing quotations: {str(e)}")


@router.get("/companies/{company_id}/quotations/{quotation_id}", response_model=QuotationOut)
async def get_quotation(company_id: str, quotation_id: str):
    """Get a specific quotation from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc = db.collection("companies").document(company_id)\
            .collection("quotations").document(quotation_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
        
        return {"id": doc.id, **serialize_firestore_doc(doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting quotation: {str(e)}")


@router.delete("/companies/{company_id}/quotations/{quotation_id}")
async def delete_quotation(company_id: str, quotation_id: str):
    """Delete a quotation from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc_ref = db.collection("companies").document(company_id)\
            .collection("quotations").document(quotation_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
        
        doc_ref.delete()
        return {"message": "Quotation deleted successfully", "id": quotation_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting quotation: {str(e)}")
