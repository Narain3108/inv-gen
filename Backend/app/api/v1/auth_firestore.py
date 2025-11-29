from fastapi import APIRouter, HTTPException, Response
from app.core.firebase import get_firestore_db
from app.schemas.auth import LoginRequest, SignupRequest, LoginResponse, SignupResponse
from app.core.security import create_access_token, get_password_hash, verify_password
from datetime import datetime
import uuid

router = APIRouter()

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
