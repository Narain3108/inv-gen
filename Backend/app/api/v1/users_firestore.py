"""
Firestore-based Users API
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from pydantic import BaseModel, EmailStr
from app.core.firebase import get_firestore_db
from app.core.deps import get_current_user_id
from datetime import datetime

router = APIRouter()


# Schemas
class UserUpdate(BaseModel):
    name: Optional[str] = None
    photo_url: Optional[str] = None


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    photo_url: Optional[str] = None
    createdAt: Optional[str] = None
    updatedAt: Optional[str] = None


@router.get("/me", response_model=UserOut)
async def get_current_user(
    user_id: str = Depends(get_current_user_id)
):
    """Get current user profile"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("users").document(user_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="User not found")
            
        user_data = doc.to_dict()
        user_data["id"] = doc.id
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")


@router.put("/me", response_model=UserOut)
async def update_current_user(
    user_update: UserUpdate,
    user_id: str = Depends(get_current_user_id)
):
    """Update current user profile"""
    try:
        db = get_firestore_db()
        doc_ref = db.collection("users").document(user_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="User not found")
            
        update_data = user_update.dict(exclude_unset=True)
        update_data["updatedAt"] = datetime.utcnow().isoformat()
        
        doc_ref.update(update_data)
        
        updated_doc = doc_ref.get()
        user_data = updated_doc.to_dict()
        user_data["id"] = updated_doc.id
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating user: {str(e)}")

