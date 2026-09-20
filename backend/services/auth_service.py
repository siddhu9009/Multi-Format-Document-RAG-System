
from datetime import datetime, timedelta, timezone
from uuid import uuid4
import os

import bcrypt
from dotenv import load_dotenv
from jose import jwt
from pymongo.errors import DuplicateKeyError

from database.connection import db


load_dotenv()


users_collection = db["users"]


# JWT settings
SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "60")
)

if not SECRET_KEY:
    raise ValueError("JWT_SECRET_KEY is not set in .env")


# Password hashing
def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")

    hashed = bcrypt.hashpw(
        password_bytes,
        bcrypt.gensalt()
    )

    return hashed.decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:

    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8")
    )


# JWT token
def create_access_token(user_id: str) -> str:

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    payload = {
        "user_id": user_id,
        "exp": expire
    }

    return jwt.encode(
        payload,
        SECRET_KEY,
        algorithm=ALGORITHM
    )


# Register user
def register_user(
    username: str,
    email: str,
    password: str
):

    existing_user = users_collection.find_one(
        {
            "email": email
        }
    )

    if existing_user:
        raise ValueError("Email already registered")

    user_id = str(uuid4())

    user = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc)
    }

    try:
        users_collection.insert_one(user)

    except DuplicateKeyError:
        raise ValueError("Email already registered")

    return {
        "user_id": user_id,
        "username": username,
        "email": email
    }


# Authenticate user
def authenticate_user(
    email: str,
    password: str
):

    user = users_collection.find_one(
        {
            "email": email
        }
    )

    if not user:
        return None

    if not verify_password(
        password,
        user["password_hash"]
    ):
        return None

    return user
