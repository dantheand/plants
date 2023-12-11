import os
from datetime import datetime, timedelta
from typing import Annotated, Optional, Union

from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2AuthorizationCodeBearer, OAuth2PasswordBearer
from jose import jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from starlette import status

from backend.utils.constants import BASE_URL

load_dotenv()

# Token stuff
JWT_SECRET_KEY = os.getenv("JWT_SIGNING_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

TOKEN_URL = "auth"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=TOKEN_URL)

FAKE_DB = ["dan.the.anderson@gmail.com"]


class User(BaseModel):
    email: Optional[str] = None
    disabled: Optional[bool] = None


class Token(BaseModel):
    access_token: str
    token_type: str


# Error
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)


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


def create_token_for_email(email: str):
    return create_access_token(data={"sub": email})


def valid_email_from_db(email):
    return email in FAKE_DB


async def get_current_user_email(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    """Returns the user from the token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise CREDENTIALS_EXCEPTION
    except jwt.JWTError:
        raise CREDENTIALS_EXCEPTION

    user = User(email=email)
    if not valid_email_from_db(email):
        raise CREDENTIALS_EXCEPTION

    return user
