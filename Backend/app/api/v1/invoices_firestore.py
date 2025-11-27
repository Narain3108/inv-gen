"""
Firestore-based Invoices API
Invoices is a SUBCOLLECTION under companies: companies/{companyId}/invoices
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
class InvoiceItemCreate(BaseModel):
    description: str
    hsn: Optional[str] = None
    quantity: float
    unit: Optional[str] = "Nos"
    unit_price: float
    discount: float = 0
    gst_rate: float = 18.0
    product_id: Optional[str] = None


class InvoiceCreate(BaseModel):
    client_id: str
    company_id: Optional[str] = None
    companyId: Optional[str] = None
    invoice_number: Optional[str] = None
    date: Optional[str] = None
    invoice_date: Optional[str] = None
    due_date: Optional[str] = None
    items: List[InvoiceItemCreate]
    notes: Optional[str] = None
    status: Optional[str] = "draft"


class InvoiceOut(BaseModel):
    id: str
    company_id: Optional[str] = None
    companyId: Optional[str] = None
    client_id: Optional[str] = None
    clientId: Optional[str] = None
    invoice_number: Optional[str] = None
    invoiceNumber: Optional[str] = None
    date: Optional[str] = None
    due_date: Optional[str] = None
    dueDate: Optional[str] = None
    items: Optional[List[dict]] = None
    subtotal: Optional[float] = None
    tax_total: Optional[float] = None
    taxTotal: Optional[float] = None
    grand_total: Optional[float] = None
    grandTotal: Optional[float] = None
    total: Optional[float] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[str] = None
    createdAt: Optional[str] = None
    updated_at: Optional[str] = None
    updatedAt: Optional[str] = None
    
    class Config:
        extra = "allow"


def calculate_invoice_totals(items: List[InvoiceItemCreate]) -> dict:
    """Calculate invoice totals with GST"""
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


@router.get("/invoices", response_model=List[InvoiceOut])
async def list_all_invoices(
    company_id: Optional[str] = None,
    client_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get invoices from top-level collection filtered by companyId (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        
        query_ref = db.collection("invoices")
        
        if company_id:
            query_ref = query_ref.where("companyId", "==", company_id)
        
        if client_id:
            query_ref = query_ref.where("clientId", "==", client_id)
        
        # Note: orderBy removed to avoid composite index requirement
        # Frontend should handle sorting if needed
        query_ref = query_ref.limit(limit).offset(skip)
        invoices = []
        
        for doc in query_ref.stream():
            invoice_data = doc.to_dict()
            invoices.append({"id": doc.id, **serialize_firestore_doc(invoice_data)})
        
        return invoices
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing invoices: {str(e)}")


@router.post("/invoices", response_model=InvoiceOut)
async def create_invoice_toplevel(invoice: InvoiceCreate):
    """Create invoice in top-level collection (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        
        # Extract company_id from request
        company_id = getattr(invoice, 'company_id', None) or getattr(invoice, 'companyId', None)
        if not company_id:
            raise HTTPException(status_code=400, detail="company_id or companyId is required")
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Calculate totals
        calculations = calculate_invoice_totals(invoice.items)
        
        # Generate invoice number
        # Get all invoices for company and find max number (avoid composite index)
        all_invoices = db.collection("invoices")\
            .where("companyId", "==", company_id)\
            .stream()
        
        last_num = 0
        for doc in all_invoices:
            invoice_data = doc.to_dict()
            if invoice_data.get("invoiceNumber"):
                try:
                    num = int(invoice_data["invoiceNumber"].split("-")[-1])
                    if num > last_num:
                        last_num = num
                except:
                    pass
        
        invoice_number = f"INV-{str(last_num + 1).zfill(3)}"
        invoice_date = invoice.date or invoice.invoice_date or datetime.utcnow().strftime("%Y-%m-%d")
        
        invoice_data = {
            "companyId": company_id,
            "clientId": invoice.client_id,
            "invoiceNumber": invoice_number,
            "date": invoice_date,
            "dueDate": invoice.due_date,
            "items": calculations["items"],
            "subtotal": calculations["subtotal"],
            "taxTotal": calculations["tax_total"],
            "grandTotal": calculations["grand_total"],
            "notes": invoice.notes,
            "status": invoice.status or "unpaid",
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        timestamp, doc_ref = db.collection("invoices").add(invoice_data)
        invoice_id = doc_ref.id
        
        return {"id": invoice_id, **invoice_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")


@router.get("/invoices/{invoice_id}", response_model=InvoiceOut)
async def get_invoice_toplevel(invoice_id: str):
    """Get single invoice from top-level collection (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        doc = db.collection("invoices").document(invoice_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return {"id": doc.id, **serialize_firestore_doc(doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting invoice: {str(e)}")


@router.put("/invoices/{invoice_id}", response_model=InvoiceOut)
async def update_invoice_toplevel(invoice_id: str, invoice: InvoiceCreate):
    """Update invoice in top-level collection (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("invoices").document(invoice_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        calculations = calculate_invoice_totals(invoice.items)
        invoice_date = invoice.date or invoice.invoice_date or datetime.utcnow().strftime("%Y-%m-%d")
        
        update_data = {
            "clientId": invoice.client_id,
            "date": invoice_date,
            "dueDate": invoice.due_date,
            "items": calculations["items"],
            "subtotal": calculations["subtotal"],
            "taxTotal": calculations["tax_total"],
            "grandTotal": calculations["grand_total"],
            "notes": invoice.notes,
            "status": invoice.status or "unpaid",
            "updatedAt": datetime.utcnow().isoformat()
        }
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating invoice: {str(e)}")


@router.delete("/invoices/{invoice_id}")
async def delete_invoice_toplevel(invoice_id: str):
    """Delete invoice from top-level collection (Frontend compatibility)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("invoices").document(invoice_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        doc_ref.delete()
        return {"message": "Invoice deleted successfully", "id": invoice_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting invoice: {str(e)}")


@router.post("/companies/{company_id}/invoices", response_model=InvoiceOut)
async def create_invoice(company_id: str, invoice: InvoiceCreate):
    """Create a new invoice in Firestore (Subcollection under company)"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Calculate totals
        calculations = calculate_invoice_totals(invoice.items)
        
        # Generate invoice number if not provided
        invoice_number = invoice.invoice_number
        if not invoice_number:
            # Get last invoice number for this company
            last_invoice = db.collection("companies").document(company_id)\
                .collection("invoices")\
                .order_by("created_at", direction="DESCENDING")\
                .limit(1)\
                .stream()
            
            last_num = 0
            for doc in last_invoice:
                last_invoice_data = doc.to_dict()
                if last_invoice_data.get("invoice_number"):
                    try:
                        last_num = int(last_invoice_data["invoice_number"].split("-")[-1])
                    except:
                        pass
            
            invoice_number = f"INV-{str(last_num + 1).zfill(3)}"
        
        # Use either date or invoice_date field
        invoice_date = invoice.date or invoice.invoice_date or datetime.utcnow().strftime("%Y-%m-%d")
        
        invoice_data = {
            "company_id": company_id,
            "client_id": invoice.client_id,
            "invoice_number": invoice_number,
            "date": invoice_date,
            "due_date": invoice.due_date,
            "items": calculations["items"],
            "subtotal": calculations["subtotal"],
            "tax_total": calculations["tax_total"],
            "grand_total": calculations["grand_total"],
            "notes": invoice.notes,
            "status": invoice.status or "unpaid",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add to subcollection: companies/{companyId}/invoices
        timestamp, doc_ref = db.collection("companies").document(company_id)\
            .collection("invoices").add(invoice_data)
        invoice_id = doc_ref.id
        
        return {"id": invoice_id, **invoice_data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating invoice: {str(e)}")


@router.get("/companies/{company_id}/invoices", response_model=List[InvoiceOut])
async def list_invoices(
    company_id: str,
    client_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    """Get all invoices from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        query = db.collection("companies").document(company_id).collection("invoices")
        
        if client_id:
            query = query.where("client_id", "==", client_id)
        
        query = query.order_by("created_at", direction="DESCENDING").limit(limit).offset(skip)
        invoices = []
        
        for doc in query.stream():
            invoice_data = doc.to_dict()
            invoices.append({"id": doc.id, **serialize_firestore_doc(invoice_data)})
        
        return invoices
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing invoices: {str(e)}")


@router.get("/companies/{company_id}/invoices/{invoice_id}", response_model=InvoiceOut)
async def get_invoice(company_id: str, invoice_id: str):
    """Get a specific invoice from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc = db.collection("companies").document(company_id)\
            .collection("invoices").document(invoice_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        return {"id": doc.id, **serialize_firestore_doc(doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting invoice: {str(e)}")


@router.put("/companies/{company_id}/invoices/{invoice_id}", response_model=InvoiceOut)
async def update_invoice(company_id: str, invoice_id: str, invoice: InvoiceCreate):
    """Update an invoice in a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc_ref = db.collection("companies").document(company_id)\
            .collection("invoices").document(invoice_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        # Calculate totals
        calculations = calculate_invoice_totals(invoice.items)
        
        update_data = {
            "client_id": invoice.client_id,
            "invoice_number": invoice.invoice_number,
            "date": invoice.date,
            "due_date": invoice.due_date,
            "items": calculations["items"],
            "subtotal": calculations["subtotal"],
            "tax_total": calculations["tax_total"],
            "grand_total": calculations["grand_total"],
            "notes": invoice.notes,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating invoice: {str(e)}")


@router.delete("/companies/{company_id}/invoices/{invoice_id}")
async def delete_invoice(company_id: str, invoice_id: str):
    """Delete an invoice from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc_ref = db.collection("companies").document(company_id)\
            .collection("invoices").document(invoice_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Invoice not found")
        
        doc_ref.delete()
        return {"message": "Invoice deleted successfully", "id": invoice_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting invoice: {str(e)}")
