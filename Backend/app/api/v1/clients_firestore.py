"""
Firestore-based Clients API
Clients are nested under Users: users/{uid}/clients
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict, Any
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
class ClientCreate(BaseModel):
    name: str = Field(..., alias="clientName")
    gstin: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    addresses: Optional[List[dict]] = None
    
    # Frontend compatibility fields
    contact: Optional[Dict[str, Any]] = None
    address: Optional[Dict[str, Any]] = None
    billing_address: Optional[Dict[str, Any]] = Field(None, alias="billingAddress")
    shipping_address: Optional[Dict[str, Any]] = Field(None, alias="shippingAddress")
    shipping_addresses: Optional[List[Dict[str, Any]]] = Field(None, alias="shippingAddresses")
    bank_details: Optional[Dict[str, Any]] = Field(None, alias="bankDetails")
    pan: Optional[str] = None
    company_id: Optional[str] = Field(None, alias="companyId")

    class Config:
        populate_by_name = True


class ClientUpdate(BaseModel):
    name: Optional[str] = Field(None, alias="clientName")
    gstin: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    addresses: Optional[List[dict]] = None
    
    contact: Optional[Dict[str, Any]] = None
    address: Optional[Dict[str, Any]] = None
    billing_address: Optional[Dict[str, Any]] = Field(None, alias="billingAddress")
    shipping_address: Optional[Dict[str, Any]] = Field(None, alias="shippingAddress")
    shipping_addresses: Optional[List[Dict[str, Any]]] = Field(None, alias="shippingAddresses")
    bank_details: Optional[Dict[str, Any]] = Field(None, alias="bankDetails")
    pan: Optional[str] = None
    company_id: Optional[str] = Field(None, alias="companyId")

    class Config:
        populate_by_name = True


class ClientOut(BaseModel):
    id: str
    name: Optional[str] = Field(None, alias="clientName")
    gstin: Optional[str] = None
    pan: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    contact: Optional[dict] = None
    addresses: Optional[List[dict]] = None
    address: Optional[dict] = None
    billing_address: Optional[dict] = Field(None, alias="billingAddress")
    shipping_address: Optional[dict] = Field(None, alias="shippingAddress")
    shipping_addresses: Optional[List[dict]] = Field(None, alias="shippingAddresses")
    bank_details: Optional[dict] = Field(None, alias="bankDetails")
    company_id: Optional[str] = Field(None, alias="companyId")
    created_at: Optional[str] = Field(None, alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")
    
    class Config:
        extra = "allow"
        populate_by_name = True


@router.post("", response_model=ClientOut)
async def create_client(
    client: ClientCreate,
    user_id: str = Depends(get_current_user_id)
):
    """Create a new client for the current user"""
    try:
        db = get_firestore_db()
        
        client_data = client.dict(by_alias=True, exclude_unset=True)
        client_data["createdAt"] = datetime.utcnow()
        client_data["updatedAt"] = datetime.utcnow()
        
        # Add to user"s clients collection
        doc_ref = db.collection("users").document(user_id).collection("clients").document()
        doc_ref.set(client_data)
        
        # Return the created client
        client_data["id"] = doc_ref.id
        return serialize_firestore_doc(client_data)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating client: {str(e)}")


@router.get("", response_model=List[ClientOut])
async def get_clients(
    user_id: str = Depends(get_current_user_id)
):
    """Get all clients for the current user"""
    try:
        db = get_firestore_db()
        clients_ref = db.collection("users").document(user_id).collection("clients")
        docs = clients_ref.stream()
        
        clients = []
        for doc in docs:
            client_data = doc.to_dict()
            client_data["id"] = doc.id
            clients.append(serialize_firestore_doc(client_data))
            
        return clients
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching clients: {str(e)}")


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Get a specific client for the current user"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("users").document(user_id).collection("clients").document(client_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Client not found")
            
        client_data = doc.to_dict()
        client_data["id"] = doc.id
        return serialize_firestore_doc(client_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching client: {str(e)}")


@router.put("/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: str, 
    client_update: ClientUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update a client for the current user"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("users").document(user_id).collection("clients").document(client_id)
        
        # Check if exists
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Client not found")
        
        update_data = client_update.dict(by_alias=True, exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow()
        
        doc_ref.update(update_data)
        
        # Return updated document
        updated_doc = doc_ref.get()
        client_data = updated_doc.to_dict()
        client_data["id"] = updated_doc.id
        return serialize_firestore_doc(client_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating client: {str(e)}")


@router.delete("/{client_id}")
async def delete_client(
    client_id: str,
    user_id: str = Depends(get_current_user_id)
):
    """Delete a client for the current user"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("users").document(user_id).collection("clients").document(client_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Client not found")
            
        doc_ref.delete()
        return {"message": "Client deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting client: {str(e)}")

