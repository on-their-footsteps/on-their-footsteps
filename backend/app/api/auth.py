from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm, HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel, EmailStr

from ..database import get_db
from ..models import User, CompanionCharacter
from ..security import verify_password, get_password_hash, create_access_token, get_current_user
from .. import schemas

router = APIRouter()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# Pydantic models
class UserLogin(BaseModel):
    email: str
    password: str
    isGuest: Optional[bool] = False

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None
    username: Optional[str] = None
    gender: Optional[str] = None  # "male" or "female"
    companion_character_id: Optional[int] = None
    selected_path: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str]
    language: str
    theme: str
    is_active: bool
    is_guest: bool
    companion_character_id: Optional[int] = None
    selected_path: Optional[str] = None
    achievements: list = []
    badges: list = []
    created_at: str
    last_active: Optional[str]

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None
    companion_character_id: Optional[int] = None
    selected_path: Optional[str] = None

@router.post("/login")
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token"""
    if credentials.isGuest:
        # Create or get guest user
        guest_user = db.query(User).filter(User.email == "guest@example.com").first()
        if not guest_user:
            guest_user = User(
                email="guest@example.com",
                full_name="ضيف",
                hashed_password=get_password_hash("guest"),
                language="ar",
                theme="light"
            )
            db.add(guest_user)
            db.commit()
            db.refresh(guest_user)
        
        access_token = create_access_token(data={"sub": guest_user.email})
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": guest_user.id,
                "email": guest_user.email,
                "full_name": guest_user.full_name,
                "language": guest_user.language,
                "theme": guest_user.theme,
                "is_active": guest_user.is_active,
                "is_guest": guest_user.is_guest,
                "companion_character_id": guest_user.companion_character_id,
                "selected_path": guest_user.selected_path,
                "achievements": guest_user.achievements or [],
                "badges": guest_user.badges or [],
                "created_at": guest_user.created_at.isoformat(),
                "last_active": guest_user.last_active.isoformat() if guest_user.last_active else None
            }
        }
    
    # Regular user login
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="البريد الإلكتروني أو كلمة المرور غير صحيحة",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="الحساب غير نشط"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "language": user.language,
            "theme": user.theme,
            "is_active": user.is_active,
            "is_guest": user.is_guest,
            "companion_character_id": user.companion_character_id,
            "selected_path": user.selected_path,
            "achievements": user.achievements or [],
            "badges": user.badges or [],
            "created_at": user.created_at.isoformat(),
            "last_active": user.last_active.isoformat() if user.last_active else None
        }
    }

@router.post("/register")
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register new user"""
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="البريد الإلكتروني مستخدم بالفعل"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        username=user_data.username or user_data.email.split("@")[0],
        full_name=user_data.full_name,
        hashed_password=hashed_password,
        language="ar",
        theme="light",
        is_guest=False,
        companion_character_id=user_data.companion_character_id,
        selected_path=user_data.selected_path
    )
    
    # Select companion character based on gender if not specified
    if not user_data.companion_character_id and user_data.gender:
        if user_data.gender == "male":
            # Select male companion (e.g., Zayd the Falcon)
            companion = db.query(CompanionCharacter).filter(
                CompanionCharacter.name == "Zayd the Falcon"
            ).first()
        else:
            # Select female companion (e.g., Layla the Gazelle)
            companion = db.query(CompanionCharacter).filter(
                CompanionCharacter.name == "Layla the Gazelle"
            ).first()
        
        if companion:
            new_user.companion_character_id = companion.id
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    access_token = create_access_token(data={"sub": new_user.email})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "language": new_user.language,
            "theme": new_user.theme,
            "is_active": new_user.is_active,
            "is_guest": new_user.is_guest,
            "companion_character_id": new_user.companion_character_id,
            "selected_path": new_user.selected_path,
            "achievements": new_user.achievements or [],
            "badges": new_user.badges or [],
            "created_at": new_user.created_at.isoformat(),
            "last_active": new_user.last_active.isoformat() if new_user.last_active else None
        }
    }

@router.post("/logout")
async def logout(current_user: User = Depends(get_current_user)):
    """Logout user (client-side token removal)"""
    return {"message": "تم تسجيل الخروج بنجاح"}

@router.get("/me")
async def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "language": current_user.language,
        "theme": current_user.theme,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat(),
        "last_active": current_user.last_active.isoformat() if current_user.last_active else None,
        "total_stories_completed": current_user.total_stories_completed,
        "total_time_spent": current_user.total_time_spent,
        "streak_days": current_user.streak_days
    }

@router.put("/profile")
async def update_profile(
    profile_data: UserUpdate, 
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    if profile_data.full_name is not None:
        current_user.full_name = profile_data.full_name
    if profile_data.language is not None:
        current_user.language = profile_data.language
    if profile_data.theme is not None:
        current_user.theme = profile_data.theme
    
    db.commit()
    db.refresh(current_user)
    
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "language": current_user.language,
        "theme": current_user.theme,
        "is_active": current_user.is_active,
        "created_at": current_user.created_at.isoformat(),
        "last_active": current_user.last_active.isoformat() if current_user.last_active else None
    }

@router.get("/validate")
async def validate_session(current_user: User = Depends(get_current_user)):
    """Validate current session"""
    return {"valid": True, "user_id": current_user.id}
