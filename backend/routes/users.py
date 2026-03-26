from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User
from config import SECRET_KEY, ALGORITHM
from pydantic import BaseModel
from typing import Optional, List
import jwt
import bcrypt
from datetime import datetime

router = APIRouter()
bearer_scheme = HTTPBearer(auto_error=False)

class CreateReviewerRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class PaginatedUsersResponse(BaseModel):
    users: List[UserResponse]
    total: int
    page: int
    page_size: int

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db)
) -> User:
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=401, detail="Authentication required")

    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    return user

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

@router.get("/users", response_model=PaginatedUsersResponse)
async def get_users(
    role: Optional[str] = None,
    page: int = 1,
    page_size: int = 10,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Get all users with pagination"""
    query = db.query(User)
    
    if role:
        query = query.filter(User.role == role)
    
    total = query.count()
    users = query.offset((page - 1) * page_size).limit(page_size).all()
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "page_size": page_size
    }

@router.post("/users/reviewer", response_model=UserResponse)
async def create_reviewer(
    data: CreateReviewerRequest,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Create a new reviewer account"""
    # Check if username exists
    existing_user = db.query(User).filter(User.username == data.username).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    
    # Check if email exists
    existing_email = db.query(User).filter(User.email == data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    if len(data.password.strip()) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    hashed_password = bcrypt.hashpw(data.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    # Create new user
    new_user = User(
        username=data.username,
        email=data.email,
        password=hashed_password,
        role="reviewer"
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Delete a user (cannot delete admins)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot delete admin users")
    
    db.delete(user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.get("/users/count")
async def get_user_count(
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Get user count by role"""
    query = db.query(User)
    if role:
        query = query.filter(User.role == role)
    count = query.count()
    return {"count": count}

@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin)
):
    """Get user by ID"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
