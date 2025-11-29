from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginResponse(BaseModel):
    token: str
    refreshToken: str
    expiresIn: str
    localId: str
    email: str
    displayName: str

class SignupResponse(BaseModel):
    message: str
    uid: str
