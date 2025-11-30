from typing import Optional
from pydantic import BaseModel, EmailStr, Field
from app.schemas.organization import OrganizationOut
from app.schemas.user import UserOut

class OrgLoginRequest(BaseModel):
    orgCode: str
    password: str

class OrgSignupRequest(BaseModel):
    orgName: str
    orgCode: str
    orgPassword: str
    adminEmail: EmailStr
    adminName: str
    adminPassword: str

class OrgLoginResponse(BaseModel):
    organization: OrganizationOut
    token: str

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str
    orgId: str

class UserLoginResponse(BaseModel):
    user: UserOut
    token: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class SignupRequest(BaseModel):
    email: EmailStr
    password: str
    name: str

class GoogleLoginRequest(BaseModel):
    token: str

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
