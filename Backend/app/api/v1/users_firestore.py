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
from app.schemas.user import UserRole
from fastapi import HTTPException

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


@router.get("", response_model=List[UserOut])
async def list_users(user: Dict = Depends(get_current_user_dep)):
    """List users with RBAC-limited visibility.
    - Super Admin: can list all users.
    - Admin: can list employees who have access to companies the admin has, plus users created by this admin.
    - Employee/others: forbidden.
    """
    try:
        db = get_firestore_db()
        users_ref = db.collection("users")

        requester_role = user.get("role")
        requester_id = user.get("id")

        users = []

        if requester_role == UserRole.SUPER_ADMIN:
            # Super admin: return users they created, users created by admins they created,
            # and any users who have access to companies the super admin has.
            caller_allowed = set(user.get("allowedCompanyIds") or [])
            seen = set()

            # 1) Users directly created by this super admin
            try:
                docs = users_ref.where("createdBy", "==", requester_id).stream()
                for doc in docs:
                    if doc.id in seen:
                        continue
                    data = doc.to_dict()
                    data.pop("password", None)
                    data["id"] = doc.id
                    users.append(data)
                    seen.add(doc.id)
            except Exception:
                pass

            # 2) Users created by admins that this super admin created
            try:
                admin_docs = users_ref.where("createdBy", "==", requester_id).where("role", "==", UserRole.ADMIN.value).stream()
                admin_ids = [d.id for d in admin_docs]
                for aid in admin_ids:
                    try:
                        docs2 = users_ref.where("createdBy", "==", aid).stream()
                        for doc in docs2:
                            if doc.id in seen:
                                continue
                            data = doc.to_dict()
                            data.pop("password", None)
                            data["id"] = doc.id
                            users.append(data)
                            seen.add(doc.id)
                    except Exception:
                        continue
            except Exception:
                pass

            # 3) Any users who have access to companies the super admin has
            for cid in caller_allowed:
                try:
                    docs3 = users_ref.where("allowedCompanyIds", "array_contains", cid).stream()
                    for doc in docs3:
                        if doc.id in seen:
                            continue
                        data = doc.to_dict()
                        data.pop("password", None)
                        data["id"] = doc.id
                        users.append(data)
                        seen.add(doc.id)
                except Exception:
                    continue

            return users

        if requester_role == UserRole.ADMIN:
            caller_allowed = set(user.get("allowedCompanyIds") or [])
            seen = set()

            # Fetch users who have access to any of the caller's companies
            for cid in caller_allowed:
                try:
                    docs = users_ref.where("allowedCompanyIds", "array_contains", cid).stream()
                    for doc in docs:
                        if doc.id in seen:
                            continue
                        data = doc.to_dict()
                        # Only include employees from company-overlap queries
                        if data.get('role') != 'employee':
                            continue
                        data.pop("password", None)
                        data["id"] = doc.id
                        users.append(data)
                        seen.add(doc.id)
                except Exception:
                    continue

            # Also include users created by this admin
            try:
                docs2 = users_ref.where("createdBy", "==", requester_id).stream()
                for doc in docs2:
                    if doc.id in seen:
                        continue
                    data = doc.to_dict()
                    data.pop("password", None)
                    data["id"] = doc.id
                    users.append(data)
                    seen.add(doc.id)
            except Exception:
                pass

            return users

        # Other roles: no access
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing users: {str(e)}")


@router.get("/{user_id}", response_model=UserOut)
async def get_user_by_id(user_id: str, user: Dict = Depends(get_current_user_dep)):
    """Get a specific user by id. Super admin can fetch any user. Admin can fetch users that share company access."""
    try:
        db = get_firestore_db()
        target = db.collection('users').document(user_id).get()
        if not target.exists:
            raise HTTPException(status_code=404, detail='User not found')

        target_data = target.to_dict()
        target_data['id'] = target.id

        # Permission checks
        requester_role = user.get('role')
        if requester_role == UserRole.SUPER_ADMIN:
            return target_data

        if requester_role == UserRole.ADMIN:
            # Allow if any company overlaps
            requester_allowed = set(user.get('allowedCompanyIds') or [])
            target_allowed = set(target_data.get('allowedCompanyIds') or [])
            if requester_allowed & target_allowed:
                return target_data
            # Also allow if requester created the user
            if target_data.get('createdBy') == user.get('id'):
                return target_data

        raise HTTPException(status_code=403, detail='Insufficient permissions')
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching user: {str(e)}")

