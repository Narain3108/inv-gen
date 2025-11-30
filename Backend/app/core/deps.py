from typing import Optional
from fastapi import Header, HTTPException, Cookie, Depends
from app.core.security import verify_token
from app.core.firebase import get_firestore_db

async def get_current_user_id(
    x_user_id: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None)
) -> str:
    """
    Identify the current user.
    Prioritizes the HTTP-only cookie (secure).
    Falls back to Authorization header (Bearer token).
    Falls back to x-user-id header for legacy/testing support.
    """
    # 1. Try Cookie (Secure JWT)
    if access_token:
        user_id = verify_token(access_token)
        if user_id:
            return user_id

    # 2. Try Authorization Header (Bearer Token)
    if authorization:
        scheme, _, token = authorization.partition(" ")
        if scheme.lower() == "bearer" and token:
            user_id = verify_token(token)
            if user_id:
                return user_id
    
    # 3. Fallback to Header (Simple ID)
    if x_user_id:
        return x_user_id
        
    raise HTTPException(status_code=401, detail="Not authenticated")

async def get_current_user(user_id: str = Depends(get_current_user_id)):
    db = get_firestore_db()
    user_doc = db.collection("users").document(user_id).get()
    if not user_doc.exists:
        raise HTTPException(status_code=401, detail="User not found")
    
    user_data = user_doc.to_dict()
    user_data["id"] = user_id
    return user_data

