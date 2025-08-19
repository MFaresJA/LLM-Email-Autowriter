# schemas.py
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum

# ---------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------
class EmailTone(str, Enum):
    FORMAL = "formal"
    INFORMAL = "informal"
    NEUTRAL = "neutral"
    FRIENDLY = "friendly"
    PROFESSIONAL = "professional"

class EmailLength(str, Enum):
    SHORT = "short"
    MEDIUM = "medium"
    LONG = "long"

# ---------------------------------------------------------------------
# Email Generation
# ---------------------------------------------------------------------
class PromptRequest(BaseModel):
    prompt: str = Field(..., min_length=5, max_length=500)
    tone: EmailTone
    length: EmailLength

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "prompt": "Request a meeting to discuss project timeline",
                "tone": "professional",
                "length": "medium"
            }
        }
    )

class EmailResponse(PromptRequest):
    id: int
    generated_email: str
    created_at: datetime

    class Config:
        orm_mode = True


    model_config = ConfigDict(from_attributes=True, orm_mode=True)

# ---------------------------------------------------------------------
# User Models
# ---------------------------------------------------------------------
class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    name: str = Field(..., min_length=2, max_length=50)
    password: str = Field(..., min_length=8, max_length=64)

class UserLogin(UserBase):
    password: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    sub: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None

class UserResponse(UserBase):
    id: int
    name: str
    created_at: datetime
    is_verified: bool = False

    class Config:
        orm_mode = True


    model_config = ConfigDict(from_attributes=True, orm_mode=True)

# ---------------------------------------------------------------------
# User Updates & Verification
# ---------------------------------------------------------------------
class UserProfileUpdate(BaseModel):
    name: Optional[str] = None

class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str

class VerificationStatus(BaseModel):
    verified: bool
    email: Optional[str] = None
    message: Optional[str] = None
