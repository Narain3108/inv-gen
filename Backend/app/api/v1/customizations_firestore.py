"""
Firestore-based Customizations API
Customizations are nested under Companies: users/{uid}/companies/{cid}/customizations
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field
from app.core.firebase import get_firestore_db
from app.core.deps import get_current_user_id
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
    user_id: str = Depends(get_current_user_id)
):
    """Create or update customization for a company"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_ref = db.collection("users").document(user_id).collection("companies").document(company_id)
        if not company_ref.get().exists:
            raise HTTPException(status_code=404, detail="Company not found")
        
        # Check if customization already exists for this type
        customizations_ref = company_ref.collection("customizations")
        
        # Query by type if possible, otherwise we might need to filter in memory or use a composite index
        # Since we don't want to force index creation, we'll fetch all (should be few) and filter
        docs = list(customizations_ref.stream())
        existing_doc = None
        
        target_type = customization.type or "invoice"
        
        for doc in docs:
            data = doc.to_dict()
            if data.get("type") == target_type:
                existing_doc = doc
                break
        
        customization_data = customization.dict(by_alias=True, exclude_unset=True)
        customization_data["company_id"] = company_id
        customization_data["updated_at"] = datetime.utcnow().isoformat()
        
        if existing_doc:
            # Update existing
            doc_ref = existing_doc.reference
            doc_ref.update(customization_data)
            doc_id = doc_ref.id
            customization_data["created_at"] = existing_doc.to_dict().get("created_at")
        else:
            # Create new
            customization_data["created_at"] = datetime.utcnow().isoformat()
            timestamp, doc_ref = customizations_ref.add(customization_data)
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
    user_id: str = Depends(get_current_user_id)
):
    """Get customization for a company"""
    try:
        db = get_firestore_db()
        
        # Verify company exists
        company_ref = db.collection("users").document(user_id).collection("companies").document(company_id)
        if not company_ref.get().exists:
            raise HTTPException(status_code=404, detail="Company not found")
            
        customizations_ref = company_ref.collection("customizations")
        
        # Fetch all and filter by type to avoid index requirements
        docs = list(customizations_ref.stream())
        target_doc = None
        
        for doc in docs:
            data = doc.to_dict()
            if data.get("type") == type:
                target_doc = doc
                break
        
        if not target_doc:
            # Return default if not found
            return {
                "id": "default",
                "company_id": company_id,
                "type": type,
                "invoice_prefix": "INV",
                "quotation_prefix": "QUO",
                "invoice_starting_number": 1,
                "quotation_starting_number": 1,
                "theme_color": "#000000",
                "font_family": "Arial",
                "logo_position": "left"
            }
            
        data = target_doc.to_dict()
        data["id"] = target_doc.id
        return serialize_firestore_doc(data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching customization: {str(e)}")

