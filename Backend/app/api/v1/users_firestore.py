"""
Simple Firestore-based Users API
"""

from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.firebase import get_firestore_db
from datetime import datetime

router = APIRouter()


# Schemas
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    photo_url: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    photo_url: Optional[str] = None
    created_at: str


@router.post("/", response_model=UserOut)
async def create_user(user: UserCreate):
    """Create a new user in Firestore"""
    try:
        db = get_firestore_db()
        
        # Create user document
        user_data = {
            "email": user.email,
            "name": user.name,
            "photo_url": user.photo_url,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # Add to Firestore
        doc_ref = db.collection("users").add(user_data)
        user_id = doc_ref[1].id
        
        return {
            "id": user_id,
            **user_data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating user: {str(e)}")


@router.get("/", response_model=List[UserOut])
async def list_users(skip: int = 0, limit: int = 50):
    """Get all users from Firestore"""
    try:
        db = get_firestore_db()
        
        # Query users
        users_ref = db.collection("users").limit(limit).offset(skip)
        users = []
        
        for doc in users_ref.stream():
            user_data = doc.to_dict()
            users.append({
                "id": doc.id,
                **user_data
            })
        
        return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing users: {str(e)}")


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: str):
    """Get a specific user from Firestore"""
    try:
        db = get_firestore_db()
        
        doc = db.collection("users").document(user_id).get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        user_data = doc.to_dict()
        return {
            "id": doc.id,
            **user_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting user: {str(e)}")


@router.put("/{user_id}", response_model=UserOut)
async def update_user(user_id: str, user: UserCreate):
    """Update a user in Firestore"""
    try:
        db = get_firestore_db()
        
        doc_ref = db.collection("users").document(user_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        update_data = {
            "email": user.email,
            "name": user.name,
            "photo_url": user.photo_url,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        user_data = updated_doc.to_dict()
        
        return {
            "id": updated_doc.id,
            **user_data
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")


@router.delete("/{user_id}")
async def delete_user(user_id: str):
    """Delete a user from Firestore"""
    try:
        db = get_firestore_db()
        
        doc_ref = db.collection("users").document(user_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
        
        doc_ref.delete()
        
        return {"message": "User deleted successfully", "id": user_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting user: {str(e)}")
