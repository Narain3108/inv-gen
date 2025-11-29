from fastapi import APIRouter, HTTPException
from app.core.firebase import get_firestore_db
from app.schemas.auth import LoginRequest, SignupRequest, LoginResponse, SignupResponse
from datetime import datetime
import uuid

router = APIRouter()

@router.post("/signup", response_model=SignupResponse)
async def signup(request: SignupRequest):
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
        "password": request.password, # In a real app, hash this!
        "name": request.name,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    users_ref.document(user_id).set(user_data)
    
    return {"message": "User created successfully", "uid": user_id}

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
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
    
    # Verify password (simple check for this architecture)
    if user_data.get("password") != request.password:
        raise HTTPException(status_code=400, detail="Invalid email or password")
    
    return {
        "token": "dummy-jwt-token", # We use x-user-id for auth
        "refreshToken": "dummy-refresh-token",
        "expiresIn": "3600",
        "localId": user_doc.id,
        "email": user_data.get("email"),
        "displayName": user_data.get("name")
    }
