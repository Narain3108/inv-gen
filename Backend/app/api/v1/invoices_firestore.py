"""
Firestore-based Invoices API
Invoices are nested under Companies: users/{uid}/companies/{cid}/invoices
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
    user: Dict = Depends(get_current_user)
):
    """Create a new invoice"""
    try:
        db = get_firestore_db()
        
        # Verify Company Access
        if user.get("role") != "super_admin" and invoice.company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied to this company")

        invoice_data = invoice.dict(by_alias=True, exclude_unset=True)
        invoice_data["createdAt"] = datetime.utcnow()
        invoice_data["updatedAt"] = datetime.utcnow()
        invoice_data["createdBy"] = user.get("id")
        
        # Add to global invoices collection
        doc_ref = db.collection("invoices").document()
        doc_ref.set(invoice_data)
        
        # Return the created invoice
        invoice_data["id"] = doc_ref.id
        return serialize_firestore_doc(invoice_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")


@router.get("", response_model=List[InvoiceOut])
async def get_invoices(
    company_id: Optional[str] = Query(None, alias="company_id"),
    companyId: Optional[str] = Query(None, alias="companyId"),
    user: Dict = Depends(get_current_user)
):
    """Get invoices. If company_id is provided, fetch from that company. Else fetch all accessible invoices."""
    try:
        db = get_firestore_db()
        invoices = []
        
        # Handle both snake_case and camelCase
        target_company_id = company_id or companyId
        
        # Determine accessible company IDs
        allowed_companies = user.get("allowedCompanyIds", [])
        
        query = db.collection("invoices")
        
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
            invoices.append(serialize_firestore_doc(data))
            
        return invoices
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching invoices: {str(e)}")


@router.get("/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(
    invoice_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get a specific invoice by ID."""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("invoices").document(invoice_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        invoice_data = doc.to_dict()
        
        # Verify Access
        company_id = invoice_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")
             
        invoice_data["id"] = doc.id
        return serialize_firestore_doc(invoice_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching invoice: {str(e)}")


@router.put("/{invoice_id}", response_model=InvoiceOut)
async def update_invoice(
    invoice_id: str, 
    invoice_update: InvoiceCreate, # Using Create schema for update as it has all fields
    user: Dict = Depends(get_current_user)
):
    """Update an invoice"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("invoices").document(invoice_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        invoice_data = doc.to_dict()
        
        # Verify Access
        company_id = invoice_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")

        update_data = invoice_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        invoice_data = updated_doc.to_dict()
        invoice_data["id"] = updated_doc.id
        return serialize_firestore_doc(invoice_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating invoice: {str(e)}")


@router.patch("/{invoice_id}", response_model=InvoiceOut)
async def patch_invoice(
    invoice_id: str, 
    invoice_update: InvoiceUpdate,
    user: Dict = Depends(get_current_user)
):
    """Partially update an invoice"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("invoices").document(invoice_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        invoice_data = doc.to_dict()
        
        # Verify Access
        company_id = invoice_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")

        update_data = invoice_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        invoice_data = updated_doc.to_dict()
        invoice_data["id"] = updated_doc.id
        return serialize_firestore_doc(invoice_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error patching invoice: {str(e)}")


@router.delete("/{invoice_id}")
async def delete_invoice(
    invoice_id: str,
    user: Dict = Depends(get_current_user)
):
    """Delete an invoice"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("invoices").document(invoice_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
            
        invoice_data = doc.to_dict()
        
        # Verify Access
        company_id = invoice_data.get("companyId")
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")
        
        doc_ref.delete()
        
        return {"message": "Invoice deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting invoice: {str(e)}")

