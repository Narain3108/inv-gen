"""
Firestore-based Companies API
Companies is a GLOBAL collection
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
class CompanyCreate(BaseModel):
    name: str
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[dict] = None
    contact: Optional[dict] = None
    bank_details: Optional[dict] = None
    logo_url: Optional[str] = None


class CompanyOut(BaseModel):
    id: str
    name: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    address: Optional[dict] = None
    contact: Optional[dict] = None
    bank_details: Optional[dict] = None
    bankDetails: Optional[dict] = None
    logo_url: Optional[str] = None
    logoUrl: Optional[str] = None
    signature_url: Optional[str] = None
    signatureUrl: Optional[str] = None
    created_at: Optional[str] = None
    createdAt: Optional[str] = None
    updated_at: Optional[str] = None
    updatedAt: Optional[str] = None
    state: Optional[str] = None
    website: Optional[str] = None
    additionalNotes: Optional[str] = None
    termsAndConditions: Optional[str] = None
    invoiceNumbering: Optional[dict] = None
    quotationNumbering: Optional[dict] = None
    
    class Config:
        extra = "allow"


@router.post("/", response_model=CompanyOut)
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
            "bank_details": company.bank_details or {},
            "logo_url": company.logo_url,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        timestamp, doc_ref = db.collection("companies").add(company_data)
        company_id = doc_ref.id
        
        return {"id": company_id, **company_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating company: {str(e)}")


@router.get("/", response_model=List[CompanyOut])
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
async def update_company(company_id: str, company: CompanyCreate):
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
            "bank_details": company.bank_details or {},
            "logo_url": company.logo_url,
            "updated_at": datetime.utcnow().isoformat()
        }
        
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
