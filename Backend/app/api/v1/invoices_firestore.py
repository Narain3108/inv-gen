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
import logging

logger = logging.getLogger(__name__)


def ensure_user_company_access(db, user: Dict[str, Any], company_id: str):
    """If the user is an admin and the company belongs to the same organization,
    add the company to the user's allowedCompanyIds to avoid access-desyncs.
    Returns True if access granted (already present or newly added), False otherwise."""
    try:
        if not company_id:
            return False

        # Super admins always have access
        if user.get('role') == 'super_admin':
            return True

        # Only auto-grant for admins (not generic employees)
        if user.get('role') != 'admin':
            return False

        # Check company exists and belongs to same org
        comp_doc = db.collection('companies').document(company_id).get()
        if not comp_doc.exists:
            return False
        comp_data = comp_doc.to_dict()
        if comp_data.get('organizationId') != user.get('organizationId'):
            return False

        allowed = user.get('allowedCompanyIds', []) or []
        if company_id in allowed:
            return True

        # Add company to user's allowedCompanyIds
        try:
            users_ref = db.collection('users')
            user_doc_ref = users_ref.document(user.get('id'))
            # Read current user's allowed list to avoid race
            cur = user_doc_ref.get()
            if cur.exists:
                cur_data = cur.to_dict()
                cur_allowed = cur_data.get('allowedCompanyIds', []) or []
                if company_id not in cur_allowed:
                    new_allowed = cur_allowed + [company_id]
                    user_doc_ref.update({'allowedCompanyIds': new_allowed, 'updatedAt': datetime.utcnow().isoformat()})
                    logger.info("ensure_user_company_access: added company %s to user %s allowedCompanyIds", company_id, user.get('id'))
                    return True
        except Exception:
            logger.exception("ensure_user_company_access: failed to add company to user")
            return False

    except Exception:
        logger.exception("ensure_user_company_access: unexpected error")
    return False

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
        allowed = user.get("allowedCompanyIds", [])
        if user.get("role") != "super_admin" and invoice.company_id not in allowed:
            # Attempt to auto-grant for admins when appropriate
            auto_granted = ensure_user_company_access(db, user, invoice.company_id)
            if auto_granted:
                try:
                    refreshed = db.collection('users').document(user.get('id')).get()
                    if refreshed.exists:
                        user = refreshed.to_dict()
                        user['id'] = refreshed.id
                        allowed = user.get('allowedCompanyIds', [])
                except Exception:
                    logger.exception("create_invoice: failed to reload user after auto-grant")
            if not auto_granted:
                logger.warning("create_invoice: access denied. user=%s role=%s allowed=%s requested_company=%s", user.get('id'), user.get('role'), allowed, invoice.company_id)
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
                # Attempt to auto-grant access for admins when company belongs to same org
                auto_granted = ensure_user_company_access(db, user, target_company_id)
                if auto_granted:
                    try:
                        refreshed = db.collection('users').document(user.get('id')).get()
                        if refreshed.exists:
                            user = refreshed.to_dict()
                            user['id'] = refreshed.id
                            allowed_companies = user.get('allowedCompanyIds', []) or []
                    except Exception:
                        logger.exception("get_invoices: failed to reload user after auto-grant")
                else:
                    logger.warning("get_invoices: access denied. user=%s role=%s allowed=%s requested_company=%s", user.get('id'), user.get('role'), allowed_companies, target_company_id)
                    raise HTTPException(status_code=403, detail="Access denied to this company")
            query = query.where("companyId", "==", target_company_id)
        else:
            # If no company specified, filter by allowed companies
            if user.get("role") != "super_admin":
                if not allowed_companies:
                    logger.info("get_invoices: user=%s has no allowed companies, returning empty list", user.get('id'))
                    return []
                if len(allowed_companies) > 0:
                     query = query.where("companyId", "in", allowed_companies[:10]) # Limit to 10 for safety
            
        docs = query.stream()
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            invoices.append(serialize_firestore_doc(data))
        logger.debug("get_invoices: returning %d invoices for user=%s requested_company=%s", len(invoices), user.get('id'), target_company_id)
            
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
            # Try to auto-grant for admins if company belongs to same org
            auto_granted = ensure_user_company_access(db, user, company_id)
            if auto_granted:
                try:
                    refreshed = db.collection('users').document(user.get('id')).get()
                    if refreshed.exists:
                        user = refreshed.to_dict()
                        user['id'] = refreshed.id
                except Exception:
                    logger.exception("get_invoice: failed to reload user after auto-grant")
            if not auto_granted:
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
            auto_granted = ensure_user_company_access(db, user, company_id)
            if auto_granted:
                try:
                    refreshed = db.collection('users').document(user.get('id')).get()
                    if refreshed.exists:
                        user = refreshed.to_dict()
                        user['id'] = refreshed.id
                except Exception:
                    logger.exception("update_invoice: failed to reload user after auto-grant")
            if not auto_granted:
                raise HTTPException(status_code=403, detail="Access denied")

        # Restrict Employee from Update
        if user.get("role") == "employee":
             raise HTTPException(status_code=403, detail="Employees cannot update records")

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
            auto_granted = ensure_user_company_access(db, user, company_id)
            if auto_granted:
                try:
                    refreshed = db.collection('users').document(user.get('id')).get()
                    if refreshed.exists:
                        user = refreshed.to_dict()
                        user['id'] = refreshed.id
                except Exception:
                    logger.exception("patch_invoice: failed to reload user after auto-grant")
            if not auto_granted:
                raise HTTPException(status_code=403, detail="Access denied")

        # Restrict Employee from Update
        if user.get("role") == "employee":
             raise HTTPException(status_code=403, detail="Employees cannot update records")

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
            auto_granted = ensure_user_company_access(db, user, company_id)
            if auto_granted:
                try:
                    refreshed = db.collection('users').document(user.get('id')).get()
                    if refreshed.exists:
                        user = refreshed.to_dict()
                        user['id'] = refreshed.id
                except Exception:
                    logger.exception("delete_invoice: failed to reload user after auto-grant")
            if not auto_granted:
                raise HTTPException(status_code=403, detail="Access denied")
        
        # Restrict Employee from Delete
        if user.get("role") == "employee":
             raise HTTPException(status_code=403, detail="Employees cannot delete records")

        doc_ref.delete()
        
        return {"message": "Invoice deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting invoice: {str(e)}")

