# auth_router.py
from fastapi import APIRouter, HTTPException, Depends, status, Request, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
import secrets
import string
from typing import Optional

from database import get_db
from models import User
from schemas import UserCreate, UserLogin, TokenResponse, UserResponse, VerificationStatus, TokenData
from auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token,
    decode_access_token,
)
from email_utils import send_verification_email, build_verification_url

router = APIRouter()
security = HTTPBearer()

def generate_verification_token(length: int = 64) -> str:
    chars = string.ascii_letters + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))

async def get_current_active_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    payload: Optional[TokenData] = decode_access_token(credentials.credentials)
    if not payload or payload.type not in {"access", "refresh"} or not payload.sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.email == payload.sub).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user

@router.post("/register", response_model=TokenResponse)
async def register(
    user: UserCreate,
    db: Session = Depends(get_db),
    background_tasks: BackgroundTasks = ...
):
    existing_user = db.query(User).filter(User.email == user.email).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    hashed_pw = hash_password(user.password)
    verification_token = generate_verification_token()
    verification_expires = datetime.utcnow() + timedelta(hours=24)

    new_user = User(
        name=user.name,
        email=user.email,
        hashed_password=hashed_pw,
        is_verified=False,
        verification_token=verification_token,
        verification_token_expires=verification_expires,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    background_tasks.add_task(
        send_verification_email,
        to_email=new_user.email,
        token=verification_token,
        display_name=new_user.name,
    )

    print(f"📧 Verification URL (debug): {build_verification_url(new_user.email, verification_token)}")

    access_token = create_access_token({"sub": new_user.email})
    refresh_token = create_refresh_token({"sub": new_user.email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.get("/verify-email", response_model=VerificationStatus)
async def verify_email(
    token: str,
    email: str,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_verified:
        return {"verified": True, "email": email, "message": "Email already verified"}

    if not user.verification_token or token != user.verification_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification token")

    if user.verification_token_expires and datetime.utcnow() > user.verification_token_expires:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification token expired")

    user.is_verified = True
    user.verification_token = None
    user.verification_token_expires = None
    db.commit()

    return {"verified": True, "email": email, "message": f"Email {email} verified successfully"}

@router.get("/verification-status", response_model=VerificationStatus)
async def check_verification_status(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    payload: Optional[TokenData] = decode_access_token(credentials.credentials)
    if not payload or payload.type != "access" or not payload.sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.email == payload.sub).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return {
        "verified": bool(user.is_verified),
        "email": user.email,
        "message": "Email verified" if user.is_verified else "Email not verified",
    }

@router.post("/resend-verification", response_model=VerificationStatus)
async def resend_verification(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security),
    background_tasks: BackgroundTasks = ...,
):
    payload: Optional[TokenData] = decode_access_token(credentials.credentials)
    if not payload or payload.type != "access" or not payload.sub:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(User.email == payload.sub).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_verified:
        return {"verified": True, "email": user.email, "message": "Email already verified"}

    user.verification_token = generate_verification_token()
    user.verification_token_expires = datetime.utcnow() + timedelta(hours=24)
    db.commit()

    background_tasks.add_task(
        send_verification_email,
        to_email=user.email,
        token=user.verification_token,
        display_name=user.name,
    )

    print(f"📧 Resent verification URL (debug): {build_verification_url(user.email, user.verification_token)}")

    return {"verified": False, "email": user.email, "message": "Verification email resent"}

@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not db_user.is_verified:
        raise HTTPException(status_code=403, detail="Email not verified. Please verify before login.")

    access_token = create_access_token({"sub": db_user.email})
    refresh_token = create_refresh_token({"sub": db_user.email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_logged_in_user(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: Request):
    header = request.headers.get("X-Refresh-Token")
    if not header or not header.startswith("Bearer "):
        raise HTTPException(status_code=403, detail="Refresh token missing or malformed")

    refresh_token_str = header[len("Bearer "):]
    payload: Optional[TokenData] = decode_access_token(refresh_token_str)
    if not payload or payload.type != "refresh" or not payload.sub:
        raise HTTPException(status_code=403, detail="Invalid or expired refresh token")

    email = payload.sub
    new_access_token = create_access_token({"sub": email})
    new_refresh_token = create_refresh_token({"sub": email})
    return {"access_token": new_access_token, "refresh_token": new_refresh_token, "token_type": "bearer"}
