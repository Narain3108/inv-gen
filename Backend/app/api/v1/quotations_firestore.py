"""
Firestore-based Quotations API
Quotations are stored in a global 'quotations' collection with 'companyId' field.
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from app.core.firebase import get_firestore_db
from app.core.deps import get_current_user
from app.core.limiter import limiter
from app.core.constants import Roles
from app.core.audit import record_audit, compute_changes
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def verify_company_access(db, user: Dict[str, Any], company_id: str) -> bool:
    """
    Verify if the user has access to the given company.
    - Super Admins: Always True
    - Employees/Admins: True if company_id in allowedCompanyIds
    - Admins: True if company belongs to same organization (Implicit Access)
    """
    if not company_id:
        return False
        
    if user.get('role') == Roles.SUPER_ADMIN:
        return True
        
    # Check explicit assignment (Fastest)
    allowed = user.get('allowedCompanyIds', []) or []
    if company_id in allowed:
        return True
        
    # Check Admin implicit access (Slower, requires DB fetch)
    if user.get('role') == Roles.ADMIN:
        try:
            comp_doc = db.collection('companies').document(company_id).get()
            if comp_doc.exists and comp_doc.to_dict().get('organizationId') == user.get('organizationId'):
                return True
        except Exception:
            logger.exception("verify_company_access: error checking admin implicit access")
            
    return False


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
@limiter.limit("1/second")
async def create_quotation(
    request: Request,
    quotation: QuotationCreate,
    user: Dict = Depends(get_current_user)
):
    """Create a new quotation"""
    try:
        db = get_firestore_db()
        
        quotation_data = quotation.dict(by_alias=True, exclude_unset=True)
        
        # Verify Access
        company_id = quotation_data.get("companyId")
        if not company_id:
             raise HTTPException(status_code=400, detail="companyId is required")
             
        if not verify_company_access(db, user, company_id):
             raise HTTPException(status_code=403, detail="Access denied to this company")

        quotation_data["createdAt"] = datetime.utcnow()
        quotation_data["updatedAt"] = datetime.utcnow()
        quotation_data["createdBy"] = user.get("id")
        # Snapshot creator username and role for display/audit
        try:
            quotation_data["createdByUsername"] = user.get("username") or user.get("name")
            quotation_data["createdByRole"] = user.get("role")
        except Exception:
            pass
        
        # Add to global quotations collection
        doc_ref = db.collection("quotations").document()
        
        # Store ID in the document
        quotation_data["id"] = doc_ref.id
        
        doc_ref.set(quotation_data)
        
        # Record audit (best-effort)
        try:
            actor = {"id": user.get("id"), "username": user.get("username"), "role": user.get("role")}
            record_audit(db, company_id=company_id, resource_type="quotation", resource_id=doc_ref.id, action="create", actor=actor, meta={"quotationNumber": quotation_data.get("quotationNumber")})
        except Exception:
            logger.exception("Failed to record audit for create_quotation")

        return serialize_firestore_doc(quotation_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating quotation: {str(e)}")


@router.get("", response_model=List[QuotationOut])
@limiter.limit("5/second")
async def get_quotations(
    request: Request,
    company_id: Optional[str] = Query(None, alias="company_id"),
    companyId: Optional[str] = Query(None, alias="companyId"),
    user: Dict = Depends(get_current_user)
):
    """Get quotations. If company_id is provided, fetch from that company. Else fetch all accessible quotations."""
    try:
        db = get_firestore_db()
        quotations = []
        
        # Handle both snake_case and camelCase
        target_company_id = company_id or companyId
        
        # Determine accessible company IDs
        allowed_companies = user.get("allowedCompanyIds", [])
        
        query = db.collection("quotations")
        
        if target_company_id:
            # Verify access
            if not verify_company_access(db, user, target_company_id):
                 raise HTTPException(status_code=403, detail="Access denied to this company")
            query = query.where("companyId", "==", target_company_id)
        else:
            # If no company specified, filter by allowed companies
            if user.get("role") != Roles.SUPER_ADMIN:
                if not allowed_companies:
                    return []
                if len(allowed_companies) > 0:
                     query = query.where("companyId", "in", allowed_companies[:10]) # Limit to 10 for safety
            
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            quotations.append(serialize_firestore_doc(data))
            
        return quotations
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching quotations: {str(e)}")


@router.get("/{quotation_id}", response_model=QuotationOut)
async def get_quotation(
    quotation_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get a specific quotation by ID"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("quotations").document(quotation_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
            
        quotation_data = doc.to_dict()
        
        # Verify Access
        company_id = quotation_data.get("companyId")
        if not verify_company_access(db, user, company_id):
             raise HTTPException(status_code=403, detail="Access denied")
             
        quotation_data["id"] = doc.id
        return serialize_firestore_doc(quotation_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching quotation: {str(e)}")


@router.put("/{quotation_id}", response_model=QuotationOut)
async def update_quotation(
    quotation_id: str, 
    quotation_update: QuotationUpdate,
    user: Dict = Depends(get_current_user)
):
    """Update a quotation"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("quotations").document(quotation_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
            
        quotation_data = doc.to_dict()
        
        # Verify Access
        company_id = quotation_data.get("companyId")
        if not verify_company_access(db, user, company_id):
             raise HTTPException(status_code=403, detail="Access denied")

        update_data = quotation_update.dict(by_alias=True, exclude_unset=True)

        # Allow employees only to update conversion/status fields (convert quotation to invoice)
        if user.get("role") == Roles.EMPLOYEE:
            allowed_fields = {"status", "convertedToInvoiceId", "converted_to_invoice_id", "updatedAt", "updated_at"}
            incoming = set(update_data.keys())
            if not incoming.issubset(allowed_fields):
                raise HTTPException(status_code=403, detail="Employees can only update quotation status/converted fields")
            # If employee is converting the quotation to an invoice, snapshot converter info
            if "convertedToInvoiceId" in update_data or "converted_to_invoice_id" in update_data:
                try:
                    update_data["convertedAt"] = datetime.utcnow()
                    update_data["convertedBy"] = user.get("id")
                    update_data["convertedByUsername"] = user.get("username") or user.get("name")
                    update_data["convertedByRole"] = user.get("role")
                except Exception:
                    pass

        update_data["updatedAt"] = datetime.utcnow()
        # Snapshot updater info for traceability
        try:
            update_data["updatedBy"] = user.get("id")
            update_data["updatedByUsername"] = user.get("username") or user.get("name")
            update_data["updatedByRole"] = user.get("role")
        except Exception:
            pass

        # Capture old state
        old_data = quotation_data.copy()

        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        quotation_data = updated_doc.to_dict()
        quotation_data["id"] = updated_doc.id

        # Record audit with computed changes (best-effort)
        try:
            new_data = quotation_data
            changes = compute_changes(old_data, new_data)
            actor = {"id": user.get("id"), "username": user.get("username"), "role": user.get("role")}
            record_audit(db, company_id=company_id, resource_type="quotation", resource_id=quotation_id, action="update", actor=actor, changes=changes)
            # If this update included a conversion, write a specific convert audit
            try:
                old_conv = old_data.get("convertedToInvoiceId") or old_data.get("converted_to_invoice_id")
                new_conv = new_data.get("convertedToInvoiceId") or new_data.get("converted_to_invoice_id")
                if new_conv and not old_conv:
                    record_audit(db, company_id=company_id, resource_type="quotation", resource_id=quotation_id, action="convert", actor=actor, meta={"invoiceId": new_conv})
            except Exception:
                logger.exception("Failed to record conversion audit for update_quotation")
        except Exception:
            logger.exception("Failed to record audit for update_quotation")

        return serialize_firestore_doc(quotation_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating quotation: {str(e)}")


@router.patch("/{quotation_id}", response_model=QuotationOut)
async def patch_quotation(
    quotation_id: str, 
    quotation_update: QuotationUpdate,
    user: Dict = Depends(get_current_user)
):
    """Partially update a quotation"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("quotations").document(quotation_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
            
        quotation_data = doc.to_dict()
        
        # Verify Access
        company_id = quotation_data.get("companyId")
        if not verify_company_access(db, user, company_id):
             raise HTTPException(status_code=403, detail="Access denied")

        update_data = quotation_update.dict(by_alias=True, exclude_unset=True)

        # Allow employees only to patch conversion/status fields (convert quotation to invoice)
        if user.get("role") == Roles.EMPLOYEE:
            allowed_fields = {"status", "convertedToInvoiceId", "converted_to_invoice_id", "updatedAt", "updated_at"}
            incoming = set(update_data.keys())
            if not incoming.issubset(allowed_fields):
                raise HTTPException(status_code=403, detail="Employees can only patch quotation status/converted fields")
            # If employee is converting the quotation to an invoice, snapshot converter info
            if "convertedToInvoiceId" in update_data or "converted_to_invoice_id" in update_data:
                try:
                    update_data["convertedAt"] = datetime.utcnow()
                    update_data["convertedBy"] = user.get("id")
                    update_data["convertedByUsername"] = user.get("username") or user.get("name")
                    update_data["convertedByRole"] = user.get("role")
                except Exception:
                    pass

        update_data["updatedAt"] = datetime.utcnow()
        # Snapshot updater info for traceability
        try:
            update_data["updatedBy"] = user.get("id")
            update_data["updatedByUsername"] = user.get("username") or user.get("name")
            update_data["updatedByRole"] = user.get("role")
        except Exception:
            pass

        # Capture old state
        old_data = quotation_data.copy()

        doc_ref.update(update_data)

        updated_doc = doc_ref.get()
        quotation_data = updated_doc.to_dict()
        quotation_data["id"] = updated_doc.id

        # Record audit with computed changes (best-effort)
        try:
            new_data = quotation_data
            changes = compute_changes(old_data, new_data)
            actor = {"id": user.get("id"), "username": user.get("username"), "role": user.get("role")}
            record_audit(db, company_id=company_id, resource_type="quotation", resource_id=quotation_id, action="patch", actor=actor, changes=changes)
            # If this patch included a conversion, write a specific convert audit
            try:
                old_conv = old_data.get("convertedToInvoiceId") or old_data.get("converted_to_invoice_id")
                new_conv = new_data.get("convertedToInvoiceId") or new_data.get("converted_to_invoice_id")
                if new_conv and not old_conv:
                    record_audit(db, company_id=company_id, resource_type="quotation", resource_id=quotation_id, action="convert", actor=actor, meta={"invoiceId": new_conv})
            except Exception:
                logger.exception("Failed to record conversion audit for patch_quotation")
        except Exception:
            logger.exception("Failed to record audit for patch_quotation")

        return serialize_firestore_doc(quotation_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error patching quotation: {str(e)}")


@router.delete("/{quotation_id}")
async def delete_quotation(
    quotation_id: str,
    user: Dict = Depends(get_current_user)
):
    """Delete a quotation"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("quotations").document(quotation_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Quotation not found")
            
        quotation_data = doc.to_dict()
        
        # Verify Access
        company_id = quotation_data.get("companyId")
        if not verify_company_access(db, user, company_id):
             raise HTTPException(status_code=403, detail="Access denied")
        
        # Restrict Employee from Delete
        if user.get("role") == Roles.EMPLOYEE:
             raise HTTPException(status_code=403, detail="Employees cannot delete records")

        # Record audit before deletion (best-effort)
        try:
            actor = {"id": user.get("id"), "username": user.get("username"), "role": user.get("role")}
            record_audit(db, company_id=company_id, resource_type="quotation", resource_id=quotation_id, action="delete", actor=actor, meta={"quotationNumber": quotation_data.get("quotationNumber")})
        except Exception:
            logger.exception("Failed to record audit for delete_quotation")

        doc_ref.delete()
        
        return {"message": "Quotation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting quotation: {str(e)}")

