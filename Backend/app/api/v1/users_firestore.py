"""
Firestore-based Users API
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional, Dict
from pydantic import BaseModel, EmailStr
from app.core.firebase import get_firestore_db
from app.core.deps import get_current_user as get_current_user_dep
from app.schemas.user import UserOut, UserUpdate
from datetime import datetime

router = APIRouter()

@router.get("/me", response_model=UserOut)
async def get_me(
    user: Dict = Depends(get_current_user_dep)
):
    """Get current user profile"""
    try:
        db = get_firestore_db()
        user_id = user.get("id")
        doc_ref = db.collection("users").document(user_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            # If user exists in Auth but not in Firestore, we might want to create it or return basic info
            # For now, let's return what we have in the token if doc doesn't exist?
            # Or raise 404.
            raise HTTPException(status_code=404, detail="User profile not found")
            
        user_data = doc.to_dict()
        user_data["id"] = doc.id
        return user_data
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")


@router.put("/me", response_model=UserOut)
async def update_me(
    user_update: UserUpdate,
    user: Dict = Depends(get_current_user_dep)
):
    """Update current user profile"""
    try:
        db = get_firestore_db()
        user_id = user.get("id")
        doc_ref = db.collection("users").document(user_id)
        
        if not doc_ref.get().exists:
            raise HTTPException(status_code=404, detail="User profile not found")
            
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

