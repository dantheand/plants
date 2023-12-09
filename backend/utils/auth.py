import os
from datetime import datetime, timedelta
from typing import Annotated, Optional, Union

from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from starlette import status

load_dotenv()

# Token stuff
JWT_SECRET_KEY = os.getenv("JWT_SIGNING_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

TOKEN_URL = "login"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=TOKEN_URL)


class Token(BaseModel):
    access_token: str
    token_type: str


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a signed JWT token with the given data and expiration time"""
    to_encode = data.copy()
    # Set the expiration time
    if expires_delta is None:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    else:
        expire = datetime.utcnow() + expires_delta
    # Add the expiration time to the token
    to_encode.update({"exp": expire})
    # Encode the token
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Password hashing stuff
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


# User management
fake_users_db = {
    "johndoe": {
        "username": "johndoe",
        "full_name": "John Doe",
        "email": "johndoe@example.com",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",
        "disabled": False,
    }
}


class User(BaseModel):
    username: str
    email: Optional[str] = None
    disabled: Optional[bool] = None


class UserInDB(User):
    hashed_password: str


def authenticate_user_password(fake_db, username: str, password: str) -> Union[bool, UserInDB]:
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def get_user(db, username: str):
    if username in db:
        user_dict = db[username]
        return UserInDB(**user_dict)


def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    creds_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid authentication credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise creds_exception
    except jwt.JWTError:
        raise creds_exception

    user = get_user(fake_users_db, username)
    if user is None:
        raise creds_exception

    return user
