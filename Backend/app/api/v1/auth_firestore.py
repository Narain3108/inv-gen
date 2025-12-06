from typing import List, Dict
import logging
from fastapi import APIRouter, HTTPException, Response, Depends
from firebase_admin import auth
from google.cloud.firestore import FieldFilter
from app.core.firebase import get_firestore_db
from app.core.config import settings
from app.schemas.auth import (
    LoginRequest, SignupRequest, LoginResponse, SignupResponse, GoogleLoginRequest,
    OrgLoginRequest, OrgSignupRequest, OrgLoginResponse, UserLoginRequest, UserLoginResponse
)
from app.schemas.organization import OrganizationOut
from app.schemas.user import UserRole, UserCreate, UserUpdate, UserOut
from app.core.security import create_access_token, get_password_hash, verify_password
from datetime import datetime
import uuid
from app.core.deps import get_current_user as get_current_user_dep

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Organization Auth ---

@router.get("/org/{org_id}", response_model=OrganizationOut)
async def get_organization(org_id: str):
    db = get_firestore_db()
    doc = db.collection("organizations").document(org_id).get()
    if not doc.exists:
        raise HTTPException(status_code=404, detail="Organization not found")
    return doc.to_dict()

@router.post("/org/signup", response_model=OrgLoginResponse)
async def org_signup(request: OrgSignupRequest, response: Response):
    db = get_firestore_db()
    orgs_ref = db.collection("organizations")
    users_ref = db.collection("users")

    # Check if org code exists
    docs = orgs_ref.where("orgCode", "==", request.orgCode).limit(1).stream()
    for _ in docs:
        raise HTTPException(status_code=400, detail="Organization code already exists")

    # Create Organization
    org_id = str(uuid.uuid4())
    org_data = {
        "id": org_id,
        "name": request.orgName,
        "orgCode": request.orgCode,
        "password": get_password_hash(request.orgPassword),
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    orgs_ref.document(org_id).set(org_data)

    # Create Super Admin User
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": request.adminEmail,
        "password": get_password_hash(request.adminPassword),
        "name": request.adminName,
        "role": UserRole.SUPER_ADMIN,
        "organizationId": org_id,
        "allowedCompanyIds": [],
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    users_ref.document(user_id).set(user_data)

    token = create_access_token(subject=f"org:{org_id}")

    # Also set cookie for organization session (if frontend expects cookie-based sessions)
    try:
        max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        cookie_opts = settings.cookie_settings
        response.set_cookie(
            key="access_token",
            value=token,
            max_age=max_age,
            httponly=cookie_opts.get("httponly", True),
            secure=cookie_opts.get("secure", True),
            samesite=cookie_opts.get("samesite"),
            domain=cookie_opts.get("domain"),
            path=cookie_opts.get("path", "/"),
        )
        logger.debug("Set cookie for org signup (org_id=%s) secure=%s samesite=%s domain=%s", org_id, cookie_opts.get("secure"), cookie_opts.get("samesite"), cookie_opts.get("domain"))
    except Exception:
        logger.exception("Failed to set cookie for org signup")

    return {
        "organization": org_data,
        "token": token
    }

@router.post("/org/login", response_model=OrgLoginResponse)
async def org_login(request: OrgLoginRequest, response: Response):
    db = get_firestore_db()
    orgs_ref = db.collection("organizations")

    query = orgs_ref.where("orgCode", "==", request.orgCode).limit(1).stream()
    org_doc = None
    for doc in query:
        org_doc = doc
        break
    
    if not org_doc:
        raise HTTPException(status_code=400, detail="Invalid organization code or password")
    
    org_data = org_doc.to_dict()
    
    if not verify_password(request.password, org_data.get("password")):
        raise HTTPException(status_code=400, detail="Invalid organization code or password")
    
    token = create_access_token(subject=f"org:{org_doc.id}")

    try:
        max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        cookie_opts = settings.cookie_settings
        response.set_cookie(
            key="access_token",
            value=token,
            max_age=max_age,
            httponly=cookie_opts.get("httponly", True),
            secure=cookie_opts.get("secure", True),
            samesite=cookie_opts.get("samesite"),
            domain=cookie_opts.get("domain"),
            path=cookie_opts.get("path", "/"),
        )
        logger.debug("Set cookie for org login (org_id=%s) secure=%s samesite=%s domain=%s", org_doc.id, cookie_opts.get("secure"), cookie_opts.get("samesite"), cookie_opts.get("domain"))
    except Exception:
        logger.exception("Failed to set cookie for org login")
    
    return {
        "organization": org_data,
        "token": token
    }

@router.post("/user/login", response_model=UserLoginResponse)
async def user_login(request: UserLoginRequest, response: Response):
    db = get_firestore_db()
    users_ref = db.collection("users")

    # Find user by email AND organizationId
    # Note: Firestore requires a composite index for this query.
    # If index is missing, check the console link in the error message.
    # Alternatively, we can query by email and filter in code (less efficient but works without index)
    query = users_ref.where(filter=FieldFilter("email", "==", request.email)).stream()
    
    user_doc = None
    for doc in query:
        data = doc.to_dict()
        if data.get("organizationId") == request.orgId:
            user_doc = doc
            break
    
    if not user_doc:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    user_data = user_doc.to_dict()
    
    if not verify_password(request.password, user_data.get("password")):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    token = create_access_token(subject=user_doc.id)
    try:
        max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        cookie_opts = settings.cookie_settings
        response.set_cookie(
            key="access_token",
            value=token,
            max_age=max_age,
            httponly=cookie_opts.get("httponly", True),
            secure=cookie_opts.get("secure", True),
            samesite=cookie_opts.get("samesite"),
            domain=cookie_opts.get("domain"),
            path=cookie_opts.get("path", "/"),
        )
        logger.debug("Set cookie for user login (user_id=%s) secure=%s samesite=%s domain=%s", user_doc.id, cookie_opts.get("secure"), cookie_opts.get("samesite"), cookie_opts.get("domain"))
    except Exception:
        logger.exception("Failed to set cookie for user login")

    return {
        "user": user_data,
        "token": token
    }

# --- User Management (Super Admin) ---

@router.get("/org/{org_id}/users", response_model=List[UserOut])
async def get_org_users(org_id: str):
    # TODO: Add permission check (current user must be Super Admin of this Org)
    db = get_firestore_db()
    users_ref = db.collection("users")
    
    query = users_ref.where("organizationId", "==", org_id).stream()
    users = []
    for doc in query:
        user_data = doc.to_dict()
        user_data["id"] = doc.id
        users.append(user_data)
        
    return users

@router.post("/users", response_model=UserOut)
async def create_sub_user(user_in: UserCreate, current_user: Dict = Depends(get_current_user_dep)):
    """Create a sub-user owned by the current super_admin.
    - Only users with role SUPER_ADMIN can create sub-users.
    - Cannot create another SUPER_ADMIN.
    - Email must be unique globally.
    """
    db = get_firestore_db()
    users_ref = db.collection("users")

    # Permission check: only super_admin can create sub-users
    if current_user.get("role") != UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Insufficient permissions to create users")

    # Prevent creating another super_admin
    if user_in.role == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot create users with role super_admin")

    # Global uniqueness check for email
    existing = users_ref.where("email", "==", user_in.email).limit(1).stream()
    for _ in existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_id = str(uuid.uuid4())
    user_data = user_in.dict()
    user_data["id"] = user_id
    user_data["password"] = get_password_hash(user_in.password)
    user_data["createdAt"] = datetime.utcnow().isoformat()
    user_data["updatedAt"] = datetime.utcnow().isoformat()
    # Set creator/owner reference for isolation
    user_data["createdBy"] = current_user.get("id")

    # Ensure allowedCompanyIds defaults to empty list if not provided
    if not user_data.get("allowedCompanyIds"):
        user_data["allowedCompanyIds"] = []

    users_ref.document(user_id).set(user_data)

    return user_data

@router.put("/users/{user_id}", response_model=UserOut)
async def update_sub_user(user_id: str, user_in: UserUpdate, current_user: Dict = Depends(get_current_user_dep)):
    """Update a sub-user. Only the creator (super_admin) can update their users.
    Prevent elevating role to SUPER_ADMIN.
    """
    db = get_firestore_db()
    users_ref = db.collection("users")

    doc_ref = users_ref.document(user_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")

    target = doc_ref.get().to_dict()
    # Only owner can update
    if current_user.get("role") != UserRole.SUPER_ADMIN or target.get("createdBy") != current_user.get("id"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to update this user")

    # Prevent promoting to super_admin
    if user_in.role == UserRole.SUPER_ADMIN:
        raise HTTPException(status_code=403, detail="Cannot set role to super_admin")

    update_data = user_in.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow().isoformat()

    doc_ref.update(update_data)

    updated_doc = doc_ref.get()
    user_data = updated_doc.to_dict()
    user_data["id"] = updated_doc.id
    return user_data

@router.delete("/users/{user_id}")
async def delete_sub_user(user_id: str, current_user: Dict = Depends(get_current_user_dep)):
    """Delete a sub-user. Only the creator (super_admin) can delete their users."""
    db = get_firestore_db()
    users_ref = db.collection("users")

    doc_ref = users_ref.document(user_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")

    target = doc_ref.get().to_dict()
    # Only owner can delete
    if current_user.get("role") != UserRole.SUPER_ADMIN or target.get("createdBy") != current_user.get("id"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to delete this user")

    users_ref.document(user_id).delete()

    return {"message": "User deleted successfully"}

# --- Legacy / General Auth ---

@router.post("/signup", response_model=SignupResponse)
async def signup(request: SignupRequest, response: Response):
    db = get_firestore_db()
    users_ref = db.collection("users")
    
    # Check if user already exists
    query = users_ref.where("email", "==", request.email).limit(1).stream()
    for _ in query:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create Organization
    org_id = str(uuid.uuid4())
    orgs_ref = db.collection("organizations")
    org_data = {
        "id": org_id,
        "name": f"{request.name}'s Organization",
        "orgCode": str(uuid.uuid4())[:8],
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    orgs_ref.document(org_id).set(org_data)

    # Create new user
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": request.email,
        "password": get_password_hash(request.password), # Securely hashed
        "name": request.name,
        "role": UserRole.SUPER_ADMIN,
        "organizationId": org_id,
        "allowedCompanyIds": [],
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    users_ref.document(user_id).set(user_data)
    
    # Create Session Token
    access_token = create_access_token(subject=user_id)
    try:
        max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        cookie_opts = settings.cookie_settings
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=max_age,
            httponly=cookie_opts.get("httponly", True),
            secure=cookie_opts.get("secure", True),
            samesite=cookie_opts.get("samesite"),
            domain=cookie_opts.get("domain"),
            path=cookie_opts.get("path", "/"),
        )
        logger.debug("Set cookie for signup (user_id=%s) secure=%s samesite=%s domain=%s", user_id, cookie_opts.get("secure"), cookie_opts.get("samesite"), cookie_opts.get("domain"))
    except Exception:
        logger.exception("Failed to set cookie for signup")
    
    return {"message": "User created successfully", "uid": user_id}

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response):
    db = get_firestore_db()
    users_ref = db.collection("users")
    
    # Find user by email
    query = users_ref.where("email", "==", request.email).limit(1).stream()
    user_doc = None
    for doc in query:
        user_doc = doc
        break
    
    if not user_doc:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    user_data = user_doc.to_dict()
    
    # Verify password
    if not verify_password(request.password, user_data.get("password")):
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    # Create Session Token
    access_token = create_access_token(subject=user_doc.id)
    try:
        max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        cookie_opts = settings.cookie_settings
        response.set_cookie(
            key="access_token",
            value=access_token,
            max_age=max_age,
            httponly=cookie_opts.get("httponly", True),
            secure=cookie_opts.get("secure", True),
            samesite=cookie_opts.get("samesite"),
            domain=cookie_opts.get("domain"),
            path=cookie_opts.get("path", "/"),
        )
        logger.debug("Set cookie for login (user_id=%s) secure=%s samesite=%s domain=%s", user_doc.id, cookie_opts.get("secure"), cookie_opts.get("samesite"), cookie_opts.get("domain"))
    except Exception:
        logger.exception("Failed to set cookie for login")
    
    return {
        "token": access_token,
        "refreshToken": "dummy-refresh-token",
        "expiresIn": "3600",
        "localId": user_doc.id,
        "email": user_data.get("email"),
        "displayName": user_data.get("name")
    }

@router.post("/logout")
async def logout(response: Response):
    try:
        cookie_opts = settings.cookie_settings
        response.delete_cookie(key="access_token", path=cookie_opts.get("path", "/"), domain=cookie_opts.get("domain"))
        logger.debug("Deleted access_token cookie domain=%s path=%s", cookie_opts.get("domain"), cookie_opts.get("path"))
    except Exception:
        logger.exception("Failed to delete access_token cookie during logout")
    return {"message": "Logged out successfully"}


@router.post("/google", response_model=LoginResponse)
async def google_login(request: GoogleLoginRequest, response: Response):
    try:
        # Verify Firebase ID Token
        decoded_token = auth.verify_id_token(request.token)
        uid = decoded_token['uid']
        email = decoded_token.get('email')
        name = decoded_token.get('name', '')
        picture = decoded_token.get('picture', '')
        
        if not email:
             raise HTTPException(status_code=400, detail="Email not found in token")

        db = get_firestore_db()
        users_ref = db.collection("users")
        
        # Check if user exists in OUR database by email
        query = users_ref.where("email", "==", email).limit(1).stream()
        user_doc = None
        for doc in query:
            user_doc = doc
            break
            
        if user_doc:
            # User exists
            user_data = user_doc.to_dict()
            user_id = user_doc.id
            user_name = user_data.get('name')
            
            # Update photo if missing
            if not user_data.get('photo_url') and picture:
                users_ref.document(user_id).update({"photo_url": picture})
        else:
            # Create new user
            # Use Firebase UID as ID for Google users
            user_id = uid 
            
            user_data = {
                "id": user_id,
                "email": email,
                "name": name,
                "photo_url": picture,
                "auth_provider": "google",
                "createdAt": datetime.utcnow().isoformat(),
                "updatedAt": datetime.utcnow().isoformat()
            }
            users_ref.document(user_id).set(user_data)
            user_name = name

        # Create Session Token (Our Custom JWT)
        access_token = create_access_token(subject=user_id)
        try:
            max_age = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            cookie_opts = settings.cookie_settings
            response.set_cookie(
                key="access_token",
                value=access_token,
                max_age=max_age,
                httponly=cookie_opts.get("httponly", True),
                secure=cookie_opts.get("secure", True),
                samesite=cookie_opts.get("samesite"),
                domain=cookie_opts.get("domain"),
                path=cookie_opts.get("path", "/"),
            )
            logger.debug("Set cookie for google login (user_id=%s) secure=%s samesite=%s domain=%s", user_id, cookie_opts.get("secure"), cookie_opts.get("samesite"), cookie_opts.get("domain"))
        except Exception:
            logger.exception("Failed to set cookie for google login")
        
        return {
            "token": access_token,
            "refreshToken": "dummy-refresh-token",
            "expiresIn": "3600",
            "localId": user_id,
            "email": email,
            "displayName": user_name
        }
        
    except Exception as e:
        print(f"Google Login Error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid authentication token")

