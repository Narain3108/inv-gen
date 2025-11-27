"""
Firestore-based Clients API
Clients is a GLOBAL collection
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
class ClientCreate(BaseModel):
    name: str
    gstin: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    addresses: Optional[List[dict]] = None


class ClientOut(BaseModel):
    id: str
    name: Optional[str] = None
    clientName: Optional[str] = None
    gstin: Optional[str] = None
    pan: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    contact: Optional[dict] = None
    addresses: Optional[List[dict]] = None
    address: Optional[dict] = None
    billingAddress: Optional[dict] = None
    bankDetails: Optional[dict] = None
    companyId: Optional[str] = None
    created_at: Optional[str] = None
    createdAt: Optional[str] = None
    updated_at: Optional[str] = None
    updatedAt: Optional[str] = None
    
    class Config:
        extra = "allow"


@router.post("/", response_model=ClientOut)
async def create_client(client: ClientCreate):
    """Create a new client in Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        
        client_data = {
            "name": client.name,
            "gstin": client.gstin,
            "contact_person": client.contact_person,
            "email": client.email,
            "phone": client.phone,
            "addresses": client.addresses or [],
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        timestamp, doc_ref = db.collection("clients").add(client_data)
        client_id = doc_ref.id
        
        return {"id": client_id, **client_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating client: {str(e)}")


@router.get("/", response_model=List[ClientOut])
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
async def update_client(client_id: str, client: ClientCreate):
    """Update a client in Firestore (Global Collection)"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("clients").document(client_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="Client not found")
        
        update_data = {
            "name": client.name,
            "gstin": client.gstin,
            "contact_person": client.contact_person,
            "email": client.email,
            "phone": client.phone,
            "addresses": client.addresses or [],
            "updated_at": datetime.utcnow().isoformat()
        }
        
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
