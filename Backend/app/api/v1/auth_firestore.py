from typing import List
from fastapi import APIRouter, HTTPException, Response, Depends
from firebase_admin import auth
from google.cloud.firestore import FieldFilter
from app.core.firebase import get_firestore_db
from app.schemas.auth import (
    LoginRequest, SignupRequest, LoginResponse, SignupResponse, GoogleLoginRequest,
    OrgLoginRequest, OrgSignupRequest, OrgLoginResponse, UserLoginRequest, UserLoginResponse
)
from app.schemas.organization import OrganizationOut
from app.schemas.user import UserRole, UserCreate, UserUpdate, UserOut
from app.core.security import create_access_token, get_password_hash, verify_password
from datetime import datetime
import uuid

router = APIRouter()

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
    
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7
    )

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
async def create_sub_user(user_in: UserCreate):
    # TODO: Add permission check
    db = get_firestore_db()
    users_ref = db.collection("users")
    
    # Check if email exists in this org
    # Using manual filtering to avoid composite index requirement
    query = users_ref.where(filter=FieldFilter("email", "==", user_in.email)).stream()
    for doc in query:
        data = doc.to_dict()
        if data.get("organizationId") == user_in.organizationId:
            raise HTTPException(status_code=400, detail="Email already registered in this organization")
        
    user_id = str(uuid.uuid4())
    user_data = user_in.dict()
    user_data["id"] = user_id
    user_data["password"] = get_password_hash(user_in.password)
    user_data["createdAt"] = datetime.utcnow().isoformat()
    user_data["updatedAt"] = datetime.utcnow().isoformat()
    
    users_ref.document(user_id).set(user_data)
    
    return user_data

@router.put("/users/{user_id}", response_model=UserOut)
async def update_sub_user(user_id: str, user_in: UserUpdate):
    # TODO: Add permission check
    db = get_firestore_db()
    users_ref = db.collection("users")
    
    doc_ref = users_ref.document(user_id)
    if not doc_ref.get().exists:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.dict(exclude_unset=True)
    update_data["updatedAt"] = datetime.utcnow().isoformat()
    
    doc_ref.update(update_data)
    
    updated_doc = doc_ref.get()
    user_data = updated_doc.to_dict()
    user_data["id"] = updated_doc.id
    return user_data

@router.delete("/users/{user_id}")
async def delete_sub_user(user_id: str):
    # TODO: Add permission check
    db = get_firestore_db()
    users_ref = db.collection("users")
    
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
    
    # Create new user
    user_id = str(uuid.uuid4())
    user_data = {
        "id": user_id,
        "email": request.email,
        "password": get_password_hash(request.password), # Securely hashed
        "name": request.name,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    users_ref.document(user_id).set(user_data)
    
    # Create Session Token
    access_token = create_access_token(subject=user_id)
    
    # Set HTTP-only Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False, # Set to True in production (HTTPS)
        samesite="lax",
        max_age=60 * 60 * 24 * 7 # 7 days
    )
    
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
    
    # Set HTTP-only Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=False, # Set to True in production (HTTPS)
        samesite="lax",
        max_age=60 * 60 * 24 * 7 # 7 days
    )
    
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
    response.delete_cookie(key="access_token")
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
        
        # Set HTTP-only Cookie
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False, # Set to True in production
            samesite="lax",
            max_age=60 * 60 * 24 * 7
        )
        
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

