from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import User
from config import (
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    NIFO_USERINFO_URL,
    NIFO_AUTO_PROVISION,
)
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Optional
import secrets
import requests

router = APIRouter()

def verify_password(plain_password, hashed_password):
    # Use direct bcrypt to avoid passlib issues
    password_bytes = plain_password.encode('utf-8')[:72]  # Truncate to 72 chars
    hash_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(password_bytes, hash_bytes)

def get_password_hash(password):
    # Use direct bcrypt to avoid passlib issues
    password_bytes = password.encode('utf-8')[:72]  # Truncate to 72 chars
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password_bytes, salt).decode('utf-8')

def authenticate_user(db: Session, username: str, password: str):
    user = db.query(User).filter(User.username == username).first()
    if not user or not user.is_active or not verify_password(password, user.password):
        return None
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def serialize_user(user: User):
    return {
        "id": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }


def create_local_token_for_user(user: User):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return create_access_token(
        data={"sub": user.username, "role": user.role},
        expires_delta=access_token_expires
    )


def _build_username_from_email(email: str, db: Session) -> str:
    base = email.split("@")[0].strip().lower().replace(" ", "_") or "user"
    username = base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        counter += 1
        username = f"{base}{counter}"
    return username


def resolve_local_user_from_nifo_token(token: str, db: Session):
    if not NIFO_USERINFO_URL:
        return {"status": "misconfigured"}

    try:
        response = requests.get(
            NIFO_USERINFO_URL,
            headers={"Authorization": f"Bearer {token}"},
            timeout=5,
        )
    except requests.RequestException:
        return {"status": "unavailable"}

    if response.status_code >= 500:
        return {"status": "unavailable"}

    if response.status_code != 200:
        return {"status": "unauthorized"}

    try:
        data = response.json()
    except ValueError:
        return {"status": "unavailable"}

    email = data.get("email")
    if not email:
        return {"status": "unauthorized"}

    user = db.query(User).filter(User.email == email).first()
    if user:
        if not user.is_active:
            return {"status": "inactive"}
        return {"status": "ok", "user": user}

    if not NIFO_AUTO_PROVISION:
        return {"status": "not_onboarded"}

    generated_password = get_password_hash(secrets.token_urlsafe(24))
    username = _build_username_from_email(email, db)
    user = User(
        username=username,
        email=email,
        password=generated_password,
        role="reviewer",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"status": "ok", "user": user}

@router.post("/auth/login")
async def login_disabled():
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail="Invoice Analyzer uses central NIFO login only. Please access this tool from NIFO.",
    )
@router.get("/auth/me")
async def auth_me_endpoint(
    authorization: Optional[str] = Header(default=None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )

    token = authorization.split(" ", 1)[1]

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = db.query(User).filter(User.username == username).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        if not user.is_active:
            raise HTTPException(status_code=403, detail="User is inactive")

        return {"user": serialize_user(user)}
    except HTTPException:
        raise
    except jwt.PyJWTError:
        bootstrap = resolve_local_user_from_nifo_token(token, db)
        if bootstrap["status"] == "misconfigured":
            raise HTTPException(status_code=503, detail="NIFO bootstrap is not configured")
        if bootstrap["status"] == "unavailable":
            raise HTTPException(status_code=503, detail="NIFO bootstrap is temporarily unavailable")
        if bootstrap["status"] == "inactive":
            raise HTTPException(status_code=403, detail="User is inactive")
        if bootstrap["status"] == "not_onboarded":
            raise HTTPException(status_code=403, detail="You are not onboarded in Invoice Analyzer")
        if bootstrap["status"] != "ok":
            raise HTTPException(status_code=401, detail="Invalid token")

        user = bootstrap["user"]
        local_token = create_local_token_for_user(user)
        return {"user": serialize_user(user), "token": local_token}
