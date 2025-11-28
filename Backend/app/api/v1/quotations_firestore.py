"""
Firestore-based Quotations API
Quotations is a SUBCOLLECTION under companies: companies/{companyId}/quotations
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
    company_id: Optional[str] = Field(None, alias="companyId")
    quotation_number: Optional[str] = Field(None, alias="quotationNumber")
    date: Optional[str] = None
    valid_until: Optional[str] = Field(None, alias="validUntil")
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
    items: Optional[List[dict]] = None
    subtotal: Optional[float] = None
    tax_total: Optional[float] = Field(None, alias="taxTotal")
    grand_total: Optional[float] = Field(None, alias="grandTotal")
    total_amount: Optional[float] = Field(None, alias="totalAmount")
    total: Optional[float] = None
    notes: Optional[str] = None
    terms: Optional[str] = None
    status: Optional[str] = None
    created_at: Optional[str] = Field(None, alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")
    
    class Config:
        extra = "allow"
        populate_by_name = True


def calculate_quotation_totals(items: List[QuotationItemCreate]) -> dict:
    """Calculate quotation totals with GST"""
    subtotal = 0
    tax_total = 0
    
    calculated_items = []
    for item in items:
        item_total = (item.quantity * item.unit_price) - item.discount
        
        # Calculate taxes
        gst_amount = item_total * (item.gst_rate / 100)
        cess_amount = item_total * (item.cess_rate / 100)
        item_tax = gst_amount + cess_amount
        
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
            "cess_rate": item.cess_rate,
            "product_id": item.product_id,
            "item_code": item.item_code,
            "serial_numbers": item.serial_numbers,
            "item_total": item_total,
            "tax_amount": item_tax,
            "total_with_tax": item_total + item_tax,
            "cgst": gst_amount / 2,
            "sgst": gst_amount / 2,
            "igst": 0,
            "cess": cess_amount
        })
    
    return {
        "items": calculated_items,
        "subtotal": subtotal,
        "tax_total": tax_total,
        "grand_total": subtotal + tax_total,
        "total_amount": subtotal + tax_total
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
            # Backfill totalAmount for frontend compatibility
            if "totalAmount" not in quotation_data and "grandTotal" in quotation_data:
                quotation_data["totalAmount"] = quotation_data["grandTotal"]
            elif "total_amount" not in quotation_data and "grand_total" in quotation_data:
                quotation_data["total_amount"] = quotation_data["grand_total"]
                
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
        company_id = quotation.company_id
        if not company_id:
            raise HTTPException(status_code=400, detail="company_id is required")
        
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
        # Use date field, fallback to current date. Note: quotation_date is not in schema.
        quotation_date = quotation.date or datetime.utcnow().strftime("%Y-%m-%d")
        
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
            "totalAmount": calculations["total_amount"],
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
        
        quotation_data = doc.to_dict()
        # Backfill totalAmount for frontend compatibility
        if "totalAmount" not in quotation_data and "grandTotal" in quotation_data:
            quotation_data["totalAmount"] = quotation_data["grandTotal"]
        elif "total_amount" not in quotation_data and "grand_total" in quotation_data:
            quotation_data["total_amount"] = quotation_data["grand_total"]
            
        return {"id": doc.id, **serialize_firestore_doc(quotation_data)}
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
        # Use date field, fallback to current date
        quotation_date = quotation.date or datetime.utcnow().strftime("%Y-%m-%d")
        
        update_data = {
            "clientId": quotation.client_id,
            "date": quotation_date,
            "validUntil": quotation.valid_until,
            "items": calculations["items"],
            "subtotal": calculations["subtotal"],
            "taxTotal": calculations["tax_total"],
            "grandTotal": calculations["grand_total"],
            "totalAmount": calculations["total_amount"],
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


@router.patch("/quotations/{quotation_id}", response_model=QuotationOut)
async def patch_quotation_toplevel(quotation_id: str, quotation: QuotationUpdate):
    """Partially update quotation in top-level collection"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("quotations").document(quotation_id)
        
        doc = doc_ref.get()
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
            
        current_data = doc.to_dict()
        
        # Prepare update data
        update_data = {}
        
        if quotation.client_id:
            update_data["clientId"] = quotation.client_id
        if quotation.company_id:
            update_data["companyId"] = quotation.company_id
        if quotation.quotation_number:
            update_data["quotationNumber"] = quotation.quotation_number
        if quotation.date:
            update_data["date"] = quotation.date
        if quotation.valid_until:
            update_data["validUntil"] = quotation.valid_until
        if quotation.notes is not None:
            update_data["notes"] = quotation.notes
        if quotation.terms is not None:
            update_data["terms"] = quotation.terms
        if quotation.status:
            update_data["status"] = quotation.status
        if quotation.converted_to_invoice_id:
            update_data["convertedToInvoiceId"] = quotation.converted_to_invoice_id
            
        if quotation.items:
            calculations = calculate_quotation_totals(quotation.items)
            update_data["items"] = calculations["items"]
            update_data["subtotal"] = calculations["subtotal"]
            update_data["taxTotal"] = calculations["tax_total"]
            update_data["grandTotal"] = calculations["grand_total"]
            update_data["totalAmount"] = calculations["total_amount"]
            
        if not update_data:
            return {"id": doc.id, **serialize_firestore_doc(current_data)}
            
        update_data["updatedAt"] = datetime.utcnow().isoformat()
        
        doc_ref.update(update_data)
        
        # Merge updates into current data for response
        updated_data = {**current_data, **update_data}
        
        return {"id": doc.id, **serialize_firestore_doc(updated_data)}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error patching quotation: {str(e)}")


@router.post("/quotations/{quotation_id}/convert_to_invoice")
async def convert_to_invoice(quotation_id: str):
    """Convert a quotation to an invoice"""
    try:
        db = get_firestore_db()
        
        # 1. Get the quotation
        quotation_ref = db.collection("quotations").document(quotation_id)
        quotation_doc = quotation_ref.get()
        
        if not quotation_doc.exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
            
        quotation_data = quotation_doc.to_dict()
        
        # Check if already converted
        if quotation_data.get("status") == "converted":
             raise HTTPException(status_code=400, detail="Quotation already converted")

        company_id = quotation_data.get("companyId")
        if not company_id:
             raise HTTPException(status_code=400, detail="Quotation has no company ID")

        # 2. Get company for invoice numbering
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
            
        company_data = company_doc.to_dict()
        invoice_numbering = company_data.get("invoiceNumbering", {})
        
        # 3. Generate Invoice Number
        prefix = invoice_numbering.get("prefix", "INV-")
        suffix = invoice_numbering.get("suffix", "")
        # Default to 1 if nextNumber is missing
        next_num = int(invoice_numbering.get("nextNumber", 1))
        
        invoice_number = f"{prefix}{str(next_num).zfill(3)}{suffix}"
        
        # Update nextNumber in company config
        invoice_numbering["nextNumber"] = next_num + 1
        db.collection("companies").document(company_id).update({
            "invoiceNumbering": invoice_numbering
        })
        
        # 4. Create Invoice Data
        current_time = datetime.utcnow().isoformat()
        
        # Handle potential snake_case vs camelCase in source data
        subtotal = float(quotation_data.get("subtotal") or 0)
        tax_total = float(quotation_data.get("taxTotal") or quotation_data.get("tax_total") or 0)
        grand_total = float(quotation_data.get("grandTotal") or quotation_data.get("grand_total") or 0)
        total_amount = float(quotation_data.get("totalAmount") or quotation_data.get("total_amount") or grand_total)
        
        invoice_data = {
            "companyId": company_id,
            "clientId": quotation_data.get("clientId") or quotation_data.get("client_id"),
            "invoiceNumber": invoice_number,
            "date": current_time[:10], 
            "dueDate": quotation_data.get("validUntil") or quotation_data.get("valid_until"),
            "items": quotation_data.get("items", []),
            "subtotal": subtotal,
            "taxTotal": tax_total,
            "grandTotal": grand_total,
            "totalAmount": total_amount,
            "notes": quotation_data.get("notes"),
            "terms": quotation_data.get("terms"),
            "status": "draft",
            "paymentStatus": "unpaid",
            "createdAt": current_time,
            "updatedAt": current_time
        }
        
        # Add to invoices TOP-LEVEL collection (to match list_all_invoices)
        inv_ref = db.collection("invoices").document()
        inv_ref.set(invoice_data)
        
        # 5. Update Quotation
        quotation_ref.update({
            "status": "converted",
            "convertedToInvoiceId": inv_ref.id,
            "updatedAt": current_time
        })
        
        return {"id": inv_ref.id, **serialize_firestore_doc(invoice_data)}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error converting quotation: {str(e)}")


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
            "total_amount": calculations["total_amount"],
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
            # Backfill totalAmount for frontend compatibility
            if "totalAmount" not in quotation_data and "grandTotal" in quotation_data:
                quotation_data["totalAmount"] = quotation_data["grandTotal"]
            elif "total_amount" not in quotation_data and "grand_total" in quotation_data:
                quotation_data["total_amount"] = quotation_data["grand_total"]
                
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
        
        quotation_data = doc.to_dict()
        # Backfill totalAmount for frontend compatibility
        if "totalAmount" not in quotation_data and "grandTotal" in quotation_data:
            quotation_data["totalAmount"] = quotation_data["grandTotal"]
        elif "total_amount" not in quotation_data and "grand_total" in quotation_data:
            quotation_data["total_amount"] = quotation_data["grand_total"]
            
        return {"id": doc.id, **serialize_firestore_doc(quotation_data)}
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
