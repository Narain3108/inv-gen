"""
Firestore-based Companies API
Companies is a GLOBAL collection
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
async def create_company(company: CompanyCreate):
    """Create a new company in Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        
        company_data = {
            "name": company.name,
            "gstin": company.gstin,
            "pan": company.pan,
            "address": company.address or {},
            "contact": company.contact or {},
            "bankDetails": company.bank_details or {},
            "logoUrl": company.logo_url,
            "signatureUrl": company.signature_url,
            "website": company.website,
            "additionalNotes": company.additional_notes,
            "termsAndConditions": company.terms_and_conditions,
            "invoiceNumbering": company.invoice_numbering,
            "quotationNumbering": company.quotation_numbering,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        timestamp, doc_ref = db.collection("companies").add(company_data)
        company_id = doc_ref.id
        
        return {"id": company_id, **company_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating company: {str(e)}")


@router.get("", response_model=List[CompanyOut])
async def list_companies(skip: int = 0, limit: int = 50):
    """Get all companies from Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        
        query = db.collection("companies").limit(limit).offset(skip)
        companies = []
        
        for doc in query.stream():
            company_data = doc.to_dict()
            companies.append({"id": doc.id, **serialize_firestore_doc(company_data)})
        
        return companies
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing companies: {str(e)}")


@router.get("/{company_id}", response_model=CompanyOut)
async def get_company(company_id: str):
    """Get a specific company from Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc = db.collection("companies").document(company_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        return {"id": doc.id, **serialize_firestore_doc(doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting company: {str(e)}")


@router.put("/{company_id}", response_model=CompanyOut)
async def update_company(company_id: str, company: CompanyUpdate):
    """Update a company in Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("companies").document(company_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        update_data = {
            "name": company.name,
            "gstin": company.gstin,
            "pan": company.pan,
            "address": company.address or {},
            "contact": company.contact or {},
            "bankDetails": company.bank_details or {},
            "logoUrl": company.logo_url,
            "signatureUrl": company.signature_url,
            "website": company.website,
            "additionalNotes": company.additional_notes,
            "termsAndConditions": company.terms_and_conditions,
            "invoiceNumbering": company.invoice_numbering,
            "quotationNumbering": company.quotation_numbering,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating company: {str(e)}")


@router.patch("/{company_id}", response_model=CompanyOut)
async def patch_company(company_id: str, company: CompanyUpdate):
    """Partially update a company in Firestore"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("companies").document(company_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Company not found")
            
        # Filter out None values and use aliases (camelCase) for Firestore keys
        update_data = company.model_dump(exclude_unset=True, by_alias=True)
        
        if not update_data:
             return {"id": company_id, **serialize_firestore_doc(doc_ref.get().to_dict())}

        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating company: {str(e)}")


@router.delete("/{company_id}")
async def delete_company(company_id: str):
    """Delete a company from Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("companies").document(company_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        doc_ref.delete()
        return {"message": "Company deleted successfully", "id": company_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting company: {str(e)}")
