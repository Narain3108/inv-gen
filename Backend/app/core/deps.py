from typing import Optional
from fastapi import Header, HTTPException

async def get_current_user_id(x_user_id: Optional[str] = Header(None)) -> str:
    """
    Extract x-user-id header to identify the current user.
    This is a simple auth mechanism for the User-Centric architecture.
    """
    if not x_user_id:
        raise HTTPException(status_code=401, detail="Missing x-user-id header. Please log in.")
    return x_user_id
