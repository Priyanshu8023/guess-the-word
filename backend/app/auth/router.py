from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.database import db
from app.auth.utils import (
    hash_password,
    verify_password,
    create_access_token,
    validate_username,
    validate_password,
)
from app.auth.dependencies import get_current_user

router = APIRouter()


class RegisterRequest(BaseModel):
    username: str
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    role: str


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(request: RegisterRequest):
    """Register a new user account."""
    # Validate username
    is_valid, message = validate_username(request.username)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    # Validate password
    is_valid, message = validate_password(request.password)
    if not is_valid:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=message)

    # Check if username already exists
    existing_user = await db.user.find_unique(where={"username": request.username})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken.",
        )

    # Create user
    hashed = hash_password(request.password)
    user = await db.user.create(
        data={
            "username": request.username,
            "password": hashed,
        }
    )

    return UserResponse(id=user.id, username=user.username, role=user.role)


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login and receive a JWT token."""
    user = await db.user.find_unique(where={"username": request.username})

    if not user or not verify_password(request.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )

    token = create_access_token({"user_id": user.id, "role": user.role})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def get_me(user=Depends(get_current_user)):
    """Get current authenticated user info."""
    return UserResponse(id=user.id, username=user.username, role=user.role)
