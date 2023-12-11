import os
from datetime import datetime, timedelta
from typing import Optional

from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from google.auth.transport import requests
from google.oauth2 import id_token
from jose import jwt
from pydantic import BaseModel
from starlette import status
from starlette.config import Config
from starlette.requests import Request

from api.constants import GOOGLE_CLIENT_ID

# TODO: store these credentials in S3 for production use
load_dotenv(".env")
config = Config(".env")
oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

JWT_SECRET_KEY = os.getenv("JWT_SIGNING_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


class User(BaseModel):
    email: Optional[str] = None
    disabled: Optional[bool] = None


CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

router = APIRouter()


@router.post("/auth")
async def auth(request: Request):

    body = await request.json()
    token = body.get("token")
    request = requests.Request()
    try:
        id_info = id_token.verify_oauth2_token(token, request, GOOGLE_CLIENT_ID)
        if not id_info:
            raise CREDENTIALS_EXCEPTION
        return create_token_for_email(id_info["email"])
    except Exception as e:
        print(e)
        raise CREDENTIALS_EXCEPTION


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
