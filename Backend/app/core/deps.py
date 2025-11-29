from typing import Optional
from fastapi import Header, HTTPException, Cookie, Depends
from app.core.security import verify_token

async def get_current_user_id(
    x_user_id: Optional[str] = Header(None),
    access_token: Optional[str] = Cookie(None)
) -> str:
    """
    Identify the current user.
    Prioritizes the HTTP-only cookie (secure).
    Falls back to x-user-id header for legacy/testing support.
    """
    # 1. Try Cookie (Secure JWT)
    if access_token:
        user_id = verify_token(access_token)
        if user_id:
            return user_id
    
    # 2. Fallback to Header (Simple ID)
    if x_user_id:
        return x_user_id
        
    raise HTTPException(status_code=401, detail="Not authenticated")

