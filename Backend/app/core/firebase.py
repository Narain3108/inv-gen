"""
Firebase Admin SDK Configuration
Handles Firebase authentication and Firestore database
"""

import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.config import settings
import os


# Initialize Firebase Admin SDK
_firebase_initialized = False
_firestore_db = None

def initialize_firebase():
    """Initialize Firebase Admin SDK with service account credentials"""
    global _firebase_initialized, _firestore_db
    
    if _firebase_initialized:
        return
    
    try:
        # Check if credentials file exists
        cred_path = settings.FIREBASE_CREDENTIALS_PATH
        if not os.path.exists(cred_path):
            print(f"⚠️  Firebase credentials file not found at: {cred_path}")
            print("⚠️  Firebase will not be available")
            return
        
        # Initialize with credentials file
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred, {
            'projectId': settings.FIREBASE_PROJECT_ID,
        })
        
        # Initialize Firestore
        _firestore_db = firestore.client()
        
        _firebase_initialized = True
        print("✅ Firebase Admin SDK initialized")
    except Exception as e:
        print(f"⚠️  Failed to initialize Firebase Admin SDK: {str(e)}")
        print("⚠️  Firebase will not be available")


def get_firestore_db():
    """Get Firestore database client"""
    if not _firebase_initialized or _firestore_db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firestore is not configured"
        )
    return _firestore_db


# Security scheme for Bearer token
security = HTTPBearer(auto_error=False)


async def verify_firebase_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict:
    """
    Verify Firebase ID token from Authorization header
    
    Args:
        credentials: HTTP Bearer token from request header
    
    Returns:
        Decoded token with user information
    
    Raises:
        HTTPException: If token is invalid or missing
    """
    if not _firebase_initialized:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Firebase authentication is not configured"
        )
    
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        # Verify the ID token
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        
        return {
            "uid": decoded_token["uid"],
            "email": decoded_token.get("email"),
            "name": decoded_token.get("name"),
            "picture": decoded_token.get("picture"),
            "email_verified": decoded_token.get("email_verified", False)
        }
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Authentication failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user(
    token_data: dict = Depends(verify_firebase_token)
) -> dict:
    """
    Get current authenticated user from token
    
    Args:
        token_data: Decoded Firebase token
    
    Returns:
        User information dictionary
    """
    return token_data


# Optional: For endpoints that can work with or without authentication
async def get_optional_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> dict | None:
    """
    Get user if authenticated, otherwise return None
    Useful for endpoints that work differently for authenticated users
    
    Args:
        credentials: HTTP Bearer token (optional)
    
    Returns:
        User information or None
    """
    if not credentials:
        return None
    
    try:
        return await verify_firebase_token(credentials)
    except HTTPException:
        return None
