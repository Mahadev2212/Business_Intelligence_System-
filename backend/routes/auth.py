# backend/routes/auth.py
"""
Authentication endpoints:
  POST /api/v1/auth/login     - returns JWT
  POST /api/v1/auth/logout    - logs event, client discards token
  POST /api/v1/auth/register  - admin only
  GET  /api/v1/auth/me        - returns current user profile
"""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from database import get_db
from models.orm import User
from services.auth_service import (
    hash_password, verify_password, create_access_token,
    get_current_user, require_admin, log_event,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


# ---- Pydantic schemas -----------------------------------------------

class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "viewer"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class UserProfile(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ---- Endpoints ------------------------------------------------------

@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Validate credentials and issue a JWT with embedded role."""
    user = db.query(User).filter(User.username == body.username).first()

    if not user or not verify_password(body.password, user.password_hash):
        # Log failed attempt (FR-06)
        log_event(
            db, "LOGIN_FAIL", request,
            username=body.username,
            payload={"reason": "invalid credentials"},
            status_code=401,
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Update last_login
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    token = create_access_token({"sub": user.username, "role": user.role})

    log_event(db, "LOGIN_SUCCESS", request, user_id=user.user_id, username=user.username)

    return TokenResponse(
        access_token=token,
        role=user.role,
        username=user.username,
    )


@router.post("/logout", status_code=204)
async def logout(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log the logout event. Token invalidation is client-side (stateless JWT)."""
    log_event(db, "LOGOUT", request, user_id=current_user.user_id, username=current_user.username)
    return None


@router.post("/register", response_model=UserProfile, status_code=201)
async def register(
    body: RegisterRequest,
    db: Session = Depends(get_db),
    _admin: User = Depends(require_admin),   # Only admins can create users
):
    """Admin-only endpoint to create new users."""
    if body.role not in ("admin", "manager", "viewer"):
        raise HTTPException(status_code=400, detail="Invalid role")

    if db.query(User).filter(User.username == body.username).first():
        raise HTTPException(status_code=409, detail="Username already exists")

    if db.query(User).filter(User.email == body.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        role=body.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/me", response_model=UserProfile)
async def get_me(current_user: User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return current_user
