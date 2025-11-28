"""
Firestore-based Clients API
Clients is a GLOBAL collection
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
    bank_details: Optional[dict] = Field(None, alias="bankDetails")
    company_id: Optional[str] = Field(None, alias="companyId")
    created_at: Optional[str] = Field(None, alias="createdAt")
    updated_at: Optional[str] = Field(None, alias="updatedAt")
    
    class Config:
        extra = "allow"
        populate_by_name = True


@router.post("", response_model=ClientOut)
async def create_client(client: ClientCreate):
    """Create a new client in Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        
        # Handle nested objects from frontend
        contact_data = client.contact or {}
        email = client.email or contact_data.get("email")
        phone = client.phone or contact_data.get("phone")
        
        client_data = {
            "name": client.name,
            "gstin": client.gstin,
            "pan": client.pan,
            "contact_person": client.contact_person,
            "email": email,
            "phone": phone,
            "contact": contact_data,
            "addresses": client.addresses or [],
            "address": client.address,
            "billingAddress": client.billing_address,
            "shippingAddress": client.shipping_address,
            "bankDetails": client.bank_details,
            "companyId": client.company_id,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        timestamp, doc_ref = db.collection("clients").add(client_data)
        client_id = doc_ref.id
        
        return {"id": client_id, **client_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating client: {str(e)}")


@router.get("", response_model=List[ClientOut])
async def list_clients(skip: int = 0, limit: int = 50):
    """Get all clients from Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        
        query = db.collection("clients").limit(limit).offset(skip)
        clients = []
        
        for doc in query.stream():
            client_data = doc.to_dict()
            clients.append({"id": doc.id, **serialize_firestore_doc(client_data)})
        
        return clients
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing clients: {str(e)}")


@router.get("/{client_id}", response_model=ClientOut)
async def get_client(client_id: str):
    """Get a specific client from Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc = db.collection("clients").document(client_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Client not found")
        
        return {"id": doc.id, **serialize_firestore_doc(doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting client: {str(e)}")


@router.put("/{client_id}", response_model=ClientOut)
async def update_client(client_id: str, client: ClientUpdate):
    """Update a client in Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("clients").document(client_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Client not found")
        
        # Handle nested objects from frontend
        contact_data = client.contact or {}
        email = client.email or contact_data.get("email")
        phone = client.phone or contact_data.get("phone")
        
        update_data = {
            "name": client.name,
            "gstin": client.gstin,
            "pan": client.pan,
            "contact_person": client.contact_person,
            "email": email,
            "phone": phone,
            "contact": contact_data,
            "addresses": client.addresses or [],
            "address": client.address,
            "billingAddress": client.billing_address,
            "shippingAddress": client.shipping_address,
            "bankDetails": client.bank_details,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if client.company_id:
            update_data["companyId"] = client.company_id
            
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating client: {str(e)}")


@router.patch("/{client_id}", response_model=ClientOut)
async def patch_client(client_id: str, client: ClientUpdate):
    """Partially update a client in Firestore"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("clients").document(client_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Client not found")
            
        # Get set fields without aliases (so name stays name)
        data = client.model_dump(exclude_unset=True)
        
        # Map snake_case to Firestore keys (camelCase)
        key_map = {
            "billing_address": "billingAddress",
            "shipping_address": "shippingAddress",
            "bank_details": "bankDetails",
            "company_id": "companyId"
            # name is "name", so no change needed
        }
        
        update_data = {}
        for k, v in data.items():
            if k in key_map:
                update_data[key_map[k]] = v
            else:
                update_data[k] = v

        if not update_data:
             return {"id": client_id, **serialize_firestore_doc(doc_ref.get().to_dict())}

        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        doc_ref.update(update_data)
        updated_doc = doc_ref.get()
        
        return {"id": updated_doc.id, **serialize_firestore_doc(updated_doc.to_dict())}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating client: {str(e)}")


@router.delete("/{client_id}")
async def delete_client(client_id: str):
    """Delete a client from Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("clients").document(client_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Client not found")
        
        doc_ref.delete()
        return {"message": "Client deleted successfully", "id": client_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting client: {str(e)}")
