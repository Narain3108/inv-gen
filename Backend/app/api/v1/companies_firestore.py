"""
Firestore-based Companies API
Companies are nested under Users: users/{uid}/companies
"""

from fastapi import APIRouter, HTTPException, Depends
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
class CompanyCreate(BaseModel):
    name: str
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[dict] = None
    contact: Optional[dict] = None
    bank_details: Optional[dict] = Field(None, alias="bankDetails")
    logo_url: Optional[str] = Field(None, alias="logoUrl")
    signature_url: Optional[str] = Field(None, alias="signatureUrl")
    website: Optional[str] = None
    additional_notes: Optional[str] = Field(None, alias="additionalNotes")
    terms_and_conditions: Optional[str] = Field(None, alias="termsAndConditions")
    invoice_numbering: Optional[dict] = Field(None, alias="invoiceNumbering")
    quotation_numbering: Optional[dict] = Field(None, alias="quotationNumbering")

    class Config:
        populate_by_name = True


class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[dict] = None
    contact: Optional[dict] = None
    bank_details: Optional[dict] = Field(None, alias="bankDetails")
    logo_url: Optional[str] = Field(None, alias="logoUrl")
    signature_url: Optional[str] = Field(None, alias="signatureUrl")
    website: Optional[str] = None
    additional_notes: Optional[str] = Field(None, alias="additionalNotes")
    terms_and_conditions: Optional[str] = Field(None, alias="termsAndConditions")
    invoice_numbering: Optional[dict] = Field(None, alias="invoiceNumbering")
    quotation_numbering: Optional[dict] = Field(None, alias="quotationNumbering")

    class Config:
        populate_by_name = True


class CompanyOut(BaseModel):
    id: str
    name: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[dict] = None
    contact: Optional[dict] = None
    bank_details: Optional[dict] = Field(None, alias="bankDetails")
    logo_url: Optional[str] = Field(None, alias="logoUrl")
    signature_url: Optional[str] = Field(None, alias="signatureUrl")
    created_at: Optional[str] = Field(None, alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")
    state: Optional[str] = None
    website: Optional[str] = None
    additional_notes: Optional[str] = Field(None, alias="additionalNotes")
    terms_and_conditions: Optional[str] = Field(None, alias="termsAndConditions")
    invoice_numbering: Optional[dict] = Field(None, alias="invoiceNumbering")
    quotation_numbering: Optional[dict] = Field(None, alias="quotationNumbering")
    
    class Config:
        extra = "allow"
        populate_by_name = True


@router.post("", response_model=CompanyOut)
async def create_company(
    company: CompanyCreate,
    user: Dict = Depends(get_current_user)
):
    """Create a new company for the current organization"""
    try:
        db = get_firestore_db()
        
        # Ensure user belongs to an organization
        org_id = user.get("organizationId")
        if not org_id:
            raise HTTPException(status_code=400, detail="User does not belong to an organization")

        # Only Super Admin can create companies
        if user.get("role") != "super_admin":
             raise HTTPException(status_code=403, detail="Only Super Admins can create companies")

        company_data = company.dict(by_alias=True, exclude_unset=True)
        company_data["organizationId"] = org_id
        company_data["createdBy"] = user.get("id")
        company_data["createdAt"] = datetime.utcnow()
        company_data["updatedAt"] = datetime.utcnow()
        
        # Add to global companies collection
        doc_ref = db.collection("companies").document()
        doc_ref.set(company_data)
        
        # Return the created company
        company_data["id"] = doc_ref.id
        return serialize_firestore_doc(company_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating company: {str(e)}")


@router.get("", response_model=List[CompanyOut])
async def get_companies(
    user: Dict = Depends(get_current_user)
):
    """Get all companies for the current organization"""
    try:
        db = get_firestore_db()
        org_id = user.get("organizationId")
        if not org_id:
            return []

        companies_ref = db.collection("companies")
        query = companies_ref.where("organizationId", "==", org_id).stream()
        
        companies = []
        allowed_ids = user.get("allowedCompanyIds", [])
        user_role = user.get("role")

        for doc in query:
            company_data = doc.to_dict()
            company_data["id"] = doc.id
            
            # Filter for non-super-admins
            if user_role != "super_admin" and doc.id not in allowed_ids:
                continue
                
            companies.append(serialize_firestore_doc(company_data))
            
        return companies
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching companies: {str(e)}")


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(
    company_id: str,
    user: Dict = Depends(get_current_user)
):
    """Get a specific company"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("companies").document(company_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
            
        company_data = doc.to_dict()
        
        # Verify Organization Access
        if company_data.get("organizationId") != user.get("organizationId"):
             raise HTTPException(status_code=403, detail="Access denied")
             
        # Verify User Access (if not super admin)
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")

        company_data["id"] = doc.id
        return serialize_firestore_doc(company_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching company: {str(e)}")


@router.put("/{company_id}", response_model=CompanyOut)
async def update_company(
    company_id: str, 
    company_update: CompanyUpdate,
    user: Dict = Depends(get_current_user)
):
    """Update a company"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("companies").document(company_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
            
        company_data = doc.to_dict()
        
        # Verify Organization Access
        if company_data.get("organizationId") != user.get("organizationId"):
             raise HTTPException(status_code=403, detail="Access denied")
             
        # Only Super Admin can update companies
        if user.get("role") != "super_admin":
             raise HTTPException(status_code=403, detail="Only Super Admins can update companies")
        
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied")

        update_data = company_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        # Return updated document
        updated_doc = doc_ref.get()
        company_data = updated_doc.to_dict()
        company_data["id"] = updated_doc.id
        return serialize_firestore_doc(company_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating company: {str(e)}")


@router.delete("/{company_id}")
async def delete_company(
    company_id: str,
    user: Dict = Depends(get_current_user)
):
    """Delete a company"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("companies").document(company_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
            
        company_data = doc.to_dict()
        
        # Verify Organization Access
        if company_data.get("organizationId") != user.get("organizationId"):
             raise HTTPException(status_code=403, detail="Access denied")
             
        # Only Super Admin can delete companies
        if user.get("role") != "super_admin":
             raise HTTPException(status_code=403, detail="Only Super Admins can delete companies")

        doc_ref.delete()
        
        return {"message": "Company deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting company: {str(e)}")

