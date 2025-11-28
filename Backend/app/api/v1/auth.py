
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from firebase_admin import auth
import httpx
from app.core.config import settings
from app.core.firebase import get_firestore_db
from datetime import datetime

router = APIRouter()

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSignup(BaseModel):
    email: EmailStr
    password: str
    name: str

@router.post("/signup")
async def signup(user: UserSignup):
    try:
        # Create user in Firebase Auth
        user_record = auth.create_user(
            email=user.email,
            password=user.password,
            display_name=user.name
        )
        
        # Create user document in Firestore
        db = get_firestore_db()
        user_data = {
            "email": user.email,
            "name": user.name,
            "photo_url": None,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        db.collection("users").document(user_record.uid).set(user_data)
        
        return {"message": "User created successfully", "uid": user_record.uid}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login")
async def login(user: UserLogin):
    if not settings.FIREBASE_API_KEY:
        raise HTTPException(status_code=500, detail="Firebase API Key not configured")
    
    url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={settings.FIREBASE_API_KEY}"
    payload = {
        "email": user.email,
        "password": user.password,
        "returnSecureToken": True
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(url, json=payload)
        
    if response.status_code != 200:
        try:
            error_detail = response.json().get("error", {}).get("message", "Invalid credentials")
        except:
            error_detail = "Invalid credentials"
        raise HTTPException(status_code=400, detail=error_detail)
        
    data = response.json()
    return {
        "token": data["idToken"],
        "refreshToken": data["refreshToken"],
        "expiresIn": data["expiresIn"],
        "localId": data["localId"],
        "email": data["email"],
        "displayName": data.get("displayName", "")
    }
