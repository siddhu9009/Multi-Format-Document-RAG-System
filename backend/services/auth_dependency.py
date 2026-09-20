
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os

from dotenv import load_dotenv

from database.connection import db


load_dotenv()


users_collection = db["users"]


# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")


security = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = users_collection.find_one(
        {
            "user_id": user_id
        }
    )

    if not user:

        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return {
        "user_id": user["user_id"],
        "username": user["username"],
        "email": user["email"]
    }
