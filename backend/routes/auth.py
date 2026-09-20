
from services.auth_dependency import get_current_user
from fastapi import Depends
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr

from services.auth_service import (
    register_user,
    authenticate_user,
    create_access_token
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


# -------------------------
# Register
# -------------------------

class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


@router.post("/register")
def register(request: RegisterRequest):

    if len(request.password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters long"
        )

    try:
        user = register_user(
            username=request.username,
            email=request.email,
            password=request.password
        )

        return {
            "message": "User registered successfully",
            "user": user
        }

    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail=str(e)
        )


# -------------------------
# Login
# -------------------------

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/login")
def login(request: LoginRequest):

    user = authenticate_user(
        email=request.email,
        password=request.password
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token(
        user_id=user["user_id"]
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "user_id": user["user_id"],
            "username": user["username"],
            "email": user["email"]
        }
    }

@router.get("/me")
def get_me(
    current_user: dict = Depends(get_current_user)
):

    return {
        "message": "Authenticated user",
        "user": current_user
    }

