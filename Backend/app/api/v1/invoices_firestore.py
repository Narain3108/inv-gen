"""
Firestore-based Invoices API
Invoices are nested under Companies: users/{uid}/companies/{cid}/invoices
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
class InvoiceItemCreate(BaseModel):
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


class InvoiceCreate(BaseModel):
    client_id: str = Field(..., alias="clientId")
    company_id: str = Field(..., alias="companyId") # Required for nesting
    invoice_number: Optional[str] = Field(None, alias="invoiceNumber")
    reference_number: Optional[str] = Field(None, alias="referenceNumber")
    date: Optional[str] = None
    due_date: Optional[str] = Field(None, alias="dueDate")
    shipping_address: Optional[Dict[str, Any]] = Field(None, alias="shippingAddress")
    items: List[InvoiceItemCreate]
    notes: Optional[str] = None
    status: Optional[str] = "draft"
    payment_status: Optional[str] = Field("unpaid", alias="paymentStatus")
    
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


class InvoiceUpdate(BaseModel):
    client_id: Optional[str] = Field(None, alias="clientId")
    company_id: Optional[str] = Field(None, alias="companyId")
    invoice_number: Optional[str] = Field(None, alias="invoiceNumber")
    reference_number: Optional[str] = Field(None, alias="referenceNumber")
    date: Optional[str] = None
    due_date: Optional[str] = Field(None, alias="dueDate")
    shipping_address: Optional[Dict[str, Any]] = Field(None, alias="shippingAddress")
    items: Optional[List[InvoiceItemCreate]] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    payment_status: Optional[str] = Field(None, alias="paymentStatus")
    
    # Payment fields
    payments: Optional[List[Dict[str, Any]]] = None
    amount_paid: Optional[float] = Field(None, alias="amountPaid")
    amount_pending: Optional[float] = Field(None, alias="amountPending")
    
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


class InvoiceOut(BaseModel):
    id: str
    company_id: Optional[str] = Field(None, alias="companyId")
    client_id: Optional[str] = Field(None, alias="clientId")
    invoice_number: Optional[str] = Field(None, alias="invoiceNumber")
    reference_number: Optional[str] = Field(None, alias="referenceNumber")
    date: Optional[str] = None
    due_date: Optional[str] = Field(None, alias="dueDate")
    shipping_address: Optional[Dict[str, Any]] = Field(None, alias="shippingAddress")
    items: Optional[List[dict]] = None
    subtotal: Optional[float] = None
    tax_total: Optional[float] = Field(None, alias="taxTotal")
    grand_total: Optional[float] = Field(None, alias="grandTotal")
    total_amount: Optional[float] = Field(None, alias="totalAmount")
    total: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    payment_status: Optional[str] = Field(None, alias="paymentStatus")
    created_at: Optional[str] = Field(None, alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")
    
    class Config:
        extra = "allow"
        populate_by_name = True


@router.post("", response_model=InvoiceOut)
async def create_invoice(
    invoice: InvoiceCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new invoice nested under a company"""
    try:
        db = get_firestore_db()
        
        invoice_data = invoice.dict(by_alias=True, exclude_unset=True)
        invoice_data["createdAt"] = datetime.utcnow()
        invoice_data["updatedAt"] = datetime.utcnow()
        invoice_data["user_id"] = user_id # Store user_id for collection group queries
        
        # Add to users/{uid}/companies/{cid}/invoices
        doc_ref = db.collection("users").document(user_id)\
            .collection("companies").document(invoice.company_id)\
            .collection("invoices").document()
            
        # Store ID in the document
        invoice_data["id"] = doc_ref.id
        
        doc_ref.set(invoice_data)
        
        return serialize_firestore_doc(invoice_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")


@router.get("", response_model=List[InvoiceOut])
async def get_invoices(
    company_id: Optional[str] = Query(None, alias="company_id"),
    companyId: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Get invoices. If company_id is provided, fetch from that company. Else fetch all user invoices."""
    try:
        db = get_firestore_db()
        invoices = []
        
        # Handle both snake_case and camelCase
        target_company_id = company_id or companyId
        
        if target_company_id:
            # Fetch from specific company
            invoices_ref = db.collection("users").document(user_id)\
                .collection("companies").document(target_company_id)\
                .collection("invoices")
            docs = invoices_ref.stream()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                invoices.append(serialize_firestore_doc(data))
        else:
            # Fetch all invoices for user using Collection Group Query
            invoices_query = db.collection_group("invoices").where("user_id", "==", user_id)
            docs = invoices_query.stream()
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                invoices.append(serialize_firestore_doc(data))
            
        return invoices
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching invoices: {str(e)}")


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(
    invoice_id: str,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific invoice by ID. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        if company_id:
            # Direct lookup
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("invoices").document(invoice_id)
            doc = doc_ref.get()
            
            if not doc.exists:
                raise HTTPException(status_code=404, detail="Invoice not found")
                
            invoice_data = doc.to_dict()
            if "id" not in invoice_data:
                invoice_data["id"] = doc.id
            return serialize_firestore_doc(invoice_data)
        else:
            # Use Collection Group Query
            query = db.collection_group("invoices")\
                .where("user_id", "==", user_id)\
                .where("id", "==", invoice_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Invoice not found")
                
            invoice_data = docs[0].to_dict()
            return serialize_firestore_doc(invoice_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{invoice_id}", response_model=InvoiceOut)
async def update_invoice(
    invoice_id: str, 
    invoice_update: InvoiceCreate, # Using Create schema for update as it has all fields
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Update an invoice. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        doc_ref = None
        
        if company_id:
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("invoices").document(invoice_id)
                
            if not doc_ref.get().exists:
                raise HTTPException(status_code=404, detail="Invoice not found")
        else:
            # Find the invoice first
            query = db.collection_group("invoices")\
                .where("user_id", "==", user_id)\
                .where("id", "==", invoice_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Invoice not found")
                
            doc_ref = docs[0].reference
        
        update_data = invoice_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        invoice_data = updated_doc.to_dict()
        if "id" not in invoice_data:
            invoice_data["id"] = updated_doc.id
        return serialize_firestore_doc(invoice_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/{invoice_id}", response_model=InvoiceOut)
async def patch_invoice(
    invoice_id: str, 
    invoice_update: InvoiceUpdate,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Partially update an invoice. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        doc_ref = None
        
        if company_id:
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("invoices").document(invoice_id)
                
            if not doc_ref.get().exists:
                raise HTTPException(status_code=404, detail="Invoice not found")
        else:
            # Find the invoice first
            query = db.collection_group("invoices")\
                .where("user_id", "==", user_id)\
                .where("id", "==", invoice_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Invoice not found")
                
            doc_ref = docs[0].reference
        
        update_data = invoice_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        invoice_data = updated_doc.to_dict()
        if "id" not in invoice_data:
            invoice_data["id"] = updated_doc.id
        return serialize_firestore_doc(invoice_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    company_id: Optional[str] = Query(None, alias="companyId"),
    user_id: str = Depends(get_current_user_id)
):
    """Delete an invoice. Provide companyId for faster, index-free lookup."""
    try:
        db = get_firestore_db()
        
        doc_ref = None
        
        if company_id:
            doc_ref = db.collection("users").document(user_id)\
                .collection("companies").document(company_id)\
                .collection("invoices").document(invoice_id)
                
            if not doc_ref.get().exists:
                raise HTTPException(status_code=404, detail="Invoice not found")
        else:
            # Find the invoice first
            query = db.collection_group("invoices")\
                .where("user_id", "==", user_id)\
                .where("id", "==", invoice_id)\
                .limit(1)
                
            docs = list(query.stream())
            
            if not docs:
                raise HTTPException(status_code=404, detail="Invoice not found")
                
            doc_ref = docs[0].reference

        doc_ref.delete()
        return {"message": "Invoice deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        error_msg = str(e)
        if "requires an index" in error_msg:
             raise HTTPException(status_code=400, detail=f"Firestore query requires an index. Please provide 'companyId' query parameter for a direct lookup to avoid this error. Original error: {error_msg}")
        raise HTTPException(status_code=500, detail=f"Error deleting invoice: {error_msg}")

