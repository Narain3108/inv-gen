"""
Firestore-based Customizations API
Customizations is a SUBCOLLECTION under companies: companies/{companyId}/customizations
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
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
class CustomizationCreate(BaseModel):
    invoice_prefix: Optional[str] = Field("INV", alias="invoicePrefix")
    quotation_prefix: Optional[str] = Field("QUO", alias="quotationPrefix")
    invoice_starting_number: Optional[int] = Field(1, alias="invoiceStartingNumber")
    quotation_starting_number: Optional[int] = Field(1, alias="quotationStartingNumber")
    terms_and_conditions: Optional[str] = Field(None, alias="termsAndConditions")
    payment_terms: Optional[str] = Field(None, alias="paymentTerms")
    signature_url: Optional[str] = Field(None, alias="signatureUrl")
    theme_color: Optional[str] = Field("#000000", alias="themeColor")
    font_family: Optional[str] = Field("Arial", alias="fontFamily")
    logo_position: Optional[str] = Field("left", alias="logoPosition")

    class Config:
        populate_by_name = True


class CustomizationOut(BaseModel):
    id: str
    company_id: Optional[str] = None
    companyId: Optional[str] = None
    invoice_prefix: Optional[str] = None
    invoicePrefix: Optional[str] = None
    quotation_prefix: Optional[str] = None
    quotationPrefix: Optional[str] = None
    invoice_starting_number: Optional[int] = None
    invoiceStartingNumber: Optional[int] = None
    quotation_starting_number: Optional[int] = None
    quotationStartingNumber: Optional[int] = None
    terms_and_conditions: Optional[str] = None
    termsAndConditions: Optional[str] = None
    payment_terms: Optional[str] = None
    paymentTerms: Optional[str] = None
    signature_url: Optional[str] = None
    signatureUrl: Optional[str] = None
    theme_color: Optional[str] = None
    themeColor: Optional[str] = None
    font_family: Optional[str] = None
    fontFamily: Optional[str] = None
    logo_position: Optional[str] = None
    logoPosition: Optional[str] = None
    created_at: Optional[str] = None
    createdAt: Optional[str] = None
    updated_at: Optional[str] = None
    updatedAt: Optional[str] = None
    
    class Config:
        extra = "allow"


@router.post("/companies/{company_id}/customizations", response_model=CustomizationOut)
async def create_customization(company_id: str, customization: CustomizationCreate):
    """Create or update customization in Firestore (Subcollection under company)"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check if customization already exists
        existing = db.collection("companies").document(company_id)\
            .collection("customizations").limit(1).stream()
        
        customization_data = {
            "company_id": company_id,
            "invoice_prefix": customization.invoice_prefix or "INV",
            "quotation_prefix": customization.quotation_prefix or "QUO",
            "invoice_starting_number": customization.invoice_starting_number or 1,
            "quotation_starting_number": customization.quotation_starting_number or 1,
            "terms_and_conditions": customization.terms_and_conditions,
            "payment_terms": customization.payment_terms,
            "signature_url": customization.signature_url,
            "theme_color": customization.theme_color or "#000000",
            "font_family": customization.font_family or "Arial",
            "logo_position": customization.logo_position or "left",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Check if already exists
        doc_id = None
        for doc in existing:
            doc_id = doc.id
            break
        
        if doc_id:
            # Update existing
            doc_ref = db.collection("companies").document(company_id)\
                .collection("customizations").document(doc_id)
            doc_ref.update(customization_data)
            return {"id": doc_id, **customization_data}
        else:
            # Create new
            customization_data["created_at"] = datetime.utcnow().isoformat()
            timestamp, doc_ref = db.collection("companies").document(company_id)\
                .collection("customizations").add(customization_data)
            customization_id = doc_ref.id
            return {"id": customization_id, **customization_data}
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating customization: {str(e)}")


@router.get("/companies/{company_id}/customizations", response_model=CustomizationOut)
async def get_customization(company_id: str):
    """Get customization for a company (usually only one per company)"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_doc = db.collection("companies").document(company_id).get()
        if not company_doc.exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Get the first (and usually only) customization
        docs = db.collection("companies").document(company_id)\
            .collection("customizations").limit(1).stream()
        
        for doc in docs:
            return {"id": doc.id, **serialize_firestore_doc(doc.to_dict())}
        
        # Return default customization if none exists
        return {
            "id": "default",
            "company_id": company_id,
            "invoice_prefix": "INV",
            "quotation_prefix": "QUO",
            "invoice_starting_number": 1,
            "quotation_starting_number": 1,
            "terms_and_conditions": None,
            "payment_terms": None,
            "signature_url": None,
            "theme_color": "#000000",
            "font_family": "Arial",
            "logo_position": "left",
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting customization: {str(e)}")


@router.put("/companies/{company_id}/customizations/{customization_id}", response_model=CustomizationOut)
async def update_customization(company_id: str, customization_id: str, customization: CustomizationCreate):
    """Update customization in a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc_ref = db.collection("companies").document(company_id)\
            .collection("customizations").document(customization_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Customization not found")
        
        update_data = {
            "invoice_prefix": customization.invoice_prefix or "INV",
            "quotation_prefix": customization.quotation_prefix or "QUO",
            "invoice_starting_number": customization.invoice_starting_number or 1,
            "quotation_starting_number": customization.quotation_starting_number or 1,
            "terms_and_conditions": customization.terms_and_conditions,
            "payment_terms": customization.payment_terms,
            "signature_url": customization.signature_url,
            "theme_color": customization.theme_color or "#000000",
            "font_family": customization.font_family or "Arial",
            "logo_position": customization.logo_position or "left",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating customization: {str(e)}")


@router.delete("/companies/{company_id}/customizations/{customization_id}")
async def delete_customization(company_id: str, customization_id: str):
    """Delete a customization from a company's subcollection"""
    try:
        db = get_firestore_db()
        
        doc_ref = db.collection("companies").document(company_id)\
            .collection("customizations").document(customization_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Customization not found")
        
        doc_ref.delete()
        return {"message": "Customization deleted successfully", "id": customization_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting customization: {str(e)}")
