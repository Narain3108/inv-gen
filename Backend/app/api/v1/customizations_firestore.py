"""
Firestore-based Customizations API
Customizations are stored in a global 'customizations' collection with 'companyId' field.
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, Dict, Any, List
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
class CustomizationCreate(BaseModel):
    type: str = "invoice"
    page_size: Optional[str] = Field("A4", alias="pageSize")
    orientation: Optional[str] = "portrait"
    margins: Optional[Dict[str, int]] = None
    
    # Sections
    company_details: Optional[Dict[str, bool]] = Field(None, alias="companyDetails")
    header: Optional[Dict[str, Any]] = None
    addresses: Optional[Dict[str, Any]] = None
    table: Optional[Dict[str, Any]] = None
    totals: Optional[Dict[str, Any]] = None
    footer: Optional[Dict[str, Any]] = None
    
    # Styling
    show_page_numbers: Optional[bool] = Field(True, alias="showPageNumbers")
    color_scheme: Optional[Dict[str, str]] = Field(None, alias="colorScheme")
    
    # Legacy fields (kept for backward compatibility if needed)
    invoice_prefix: Optional[str] = Field(None, alias="invoicePrefix")
    quotation_prefix: Optional[str] = Field(None, alias="quotationPrefix")
    invoice_starting_number: Optional[int] = Field(None, alias="invoiceStartingNumber")
    quotation_starting_number: Optional[int] = Field(None, alias="quotationStartingNumber")

    class Config:
        populate_by_name = True
        extra = "allow"


class CustomizationOut(BaseModel):
    id: str
    company_id: Optional[str] = Field(None, alias="companyId")
    type: Optional[str] = None
    
    page_size: Optional[str] = Field(None, alias="pageSize")
    orientation: Optional[str] = None
    margins: Optional[Dict[str, int]] = None
    
    company_details: Optional[Dict[str, bool]] = Field(None, alias="companyDetails")
    header: Optional[Dict[str, Any]] = None
    addresses: Optional[Dict[str, Any]] = None
    table: Optional[Dict[str, Any]] = None
    totals: Optional[Dict[str, Any]] = None
    footer: Optional[Dict[str, Any]] = None
    
    show_page_numbers: Optional[bool] = Field(None, alias="showPageNumbers")
    color_scheme: Optional[Dict[str, str]] = Field(None, alias="colorScheme")
    
    created_at: Optional[str] = Field(None, alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")
    
    class Config:
        extra = "allow"
        populate_by_name = True


@router.post("/companies/{company_id}/customizations", response_model=CustomizationOut)
async def create_customization(
    company_id: str, 
    customization: CustomizationCreate,
    user: Dict = Depends(get_current_user)
):
    """Create or update customization for a company"""
    try:
        db = get_firestore_db()
        
        # Verify Access
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied to this company")
        
        # Check if customization already exists for this type
        target_type = customization.type or "invoice"
        
        query = db.collection("customizations")\
            .where("companyId", "==", company_id)\
            .where("type", "==", target_type)\
            .limit(1)
            
        docs = list(query.stream())
        existing_doc = docs[0] if docs else None
        
        customization_data = customization.dict(by_alias=True, exclude_unset=True)
        customization_data["companyId"] = company_id
        customization_data["updatedAt"] = datetime.utcnow().isoformat()
        
        if existing_doc:
            # Update existing
            doc_ref = existing_doc.reference
            doc_ref.update(customization_data)
            doc_id = doc_ref.id
            # Preserve createdAt
            existing_data = existing_doc.to_dict()
            customization_data["createdAt"] = existing_data.get("createdAt")
        else:
            # Create new
            customization_data["createdAt"] = datetime.utcnow().isoformat()
            doc_ref = db.collection("customizations").document()
            doc_ref.set(customization_data)
            doc_id = doc_ref.id
        
        return {"id": doc_id, **customization_data}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating customization: {str(e)}")


@router.get("/companies/{company_id}/customizations", response_model=CustomizationOut)
async def get_customization(
    company_id: str,
    type: Optional[str] = Query("invoice", description="Type of customization (invoice or quotation)"),
    user: Dict = Depends(get_current_user)
):
    """Get customization for a company"""
    try:
        db = get_firestore_db()
        
        # Verify Access
        if user.get("role") != "super_admin" and company_id not in user.get("allowedCompanyIds", []):
             raise HTTPException(status_code=403, detail="Access denied to this company")
            
        query = db.collection("customizations")\
            .where("companyId", "==", company_id)\
            .where("type", "==", type)\
            .limit(1)
            
        docs = list(query.stream())
        
        if not docs:
            # Return default if not found
            return {
                "id": "default",
                "companyId": company_id,
                "type": type,
                "invoicePrefix": "INV",
                "quotationPrefix": "QUO",
                "invoiceStartingNumber": 1,
                "quotationStartingNumber": 1,
                "colorScheme": {"primary": "#000000"},
                "pageSize": "A4",
                "orientation": "portrait"
            }
            
        data = docs[0].to_dict()
        data["id"] = docs[0].id
        return serialize_firestore_doc(data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customization: {str(e)}")

