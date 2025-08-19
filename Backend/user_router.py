# user_router.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from schemas import UserProfileUpdate, PasswordUpdate, TokenData
from auth import get_current_token, verify_password, hash_password

router = APIRouter()  # mounted at /api/user

@router.get("/profile")
def get_user_profile(
    db: Session = Depends(get_db),
    token: TokenData = Depends(get_current_token)
):
    user = db.query(User).filter(User.email == token.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "name": user.name,
        "email": user.email,
        "is_verified": True,
    }

@router.patch("/profile")
def update_profile(
    profile_data: UserProfileUpdate,
    db: Session = Depends(get_db),
    token: TokenData = Depends(get_current_token)
):
    user = db.query(User).filter(User.email == token.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if profile_data.name:
        user.name = profile_data.name

    db.commit()
    return {"message": "Profile updated successfully"}

@router.post("/change-password")
def change_password(
    password_data: PasswordUpdate,
    db: Session = Depends(get_db),
    token: TokenData = Depends(get_current_token)
):
    user = db.query(User).filter(User.email == token.sub).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(password_data.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    user.hashed_password = hash_password(password_data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}