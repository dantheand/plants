import logging
from datetime import datetime, timedelta
from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from google.auth.transport import requests
from google.oauth2 import id_token
from jose import jwt
from starlette.requests import Request

from api.constants import ALGORITHM, CREDENTIALS_EXCEPTION, GOOGLE_CLIENT_ID, JWT_SECRET_KEY, TOKEN_URL
from api.dependencies import get_current_user
from api.utils.schema import User

ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = APIRouter()


@router.get("/check_token")
async def check_valid_user_token(user: Annotated[User, Depends(get_current_user)]) -> bool:
    if user:
        return True
    return False


@router.post(f"/{TOKEN_URL}")
async def auth(request: Request):
    """Authenticates a users oauth2 token and returns a JWT token with their email encoded in it"""
    body = await request.json()
    token = body.get("token")
    nonce = body.get("nonce")
    request = requests.Request()
    try:
        id_info = id_token.verify_oauth2_token(token, request, GOOGLE_CLIENT_ID)
        if not id_info:
            logging.error("Could not verify id token: %s", id_info)
            raise CREDENTIALS_EXCEPTION
        if nonce != id_info["nonce"]:
            logging.error("Invalid nonce: %s", nonce)
            raise CREDENTIALS_EXCEPTION
        return (create_token_for_email(id_info["email"]),)

    except Exception as e:
        logging.error(e)
        raise CREDENTIALS_EXCEPTION


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a signed JWT token with the given data and expiration time"""
    to_encode = data.copy()
    if expires_delta is None:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    else:
        expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    try:
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    except jwt.JWTError as e:
        logging.error(e)
        raise e
    return encoded_jwt


def create_token_for_email(email: str):
    return create_access_token(data={"sub": email})
