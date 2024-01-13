import logging
from datetime import datetime, timedelta
from typing import Annotated, Optional

import jose
from fastapi import Depends, Response
from google.auth.transport import requests
from google.oauth2 import id_token
from jose import jwt
from starlette.requests import Request

from plant_api.constants import (
    ALGORITHM,
    AWS_DEPLOYMENT_ENV,
    CREDENTIALS_EXCEPTION,
    GOOGLE_CLIENT_ID,
    GoogleOauthPayload,
    TOKEN_URL,
    get_jwt_secret,
)
from plant_api.dependencies import get_current_user
from plant_api.routers.common import BaseRouter
from plant_api.schema import User
from plant_api.utils.deployment import get_deployment_env

ACCESS_TOKEN_EXPIRE_MINUTES = 30

router = BaseRouter()


@router.get("/check_token")
async def check_valid_user_token(user: Annotated[User, Depends(get_current_user)]) -> bool:
    if user:
        return True
    return False


@router.post(f"/{TOKEN_URL}")
async def auth(request: Request, response: Response):
    """Authenticates a users oauth2 token and returns a JWT token with their email encoded in it"""
    body = await request.json()
    token = body.get("token")
    nonce = body.get("nonce")
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        if not id_info:
            logging.error("Could not verify id token: %s", id_info)
            raise CREDENTIALS_EXCEPTION
        if nonce != id_info["nonce"]:
            logging.error("Invalid nonce: %s", nonce)
            raise CREDENTIALS_EXCEPTION
        payload = GoogleOauthPayload(**id_info)

        # Set the refresh token cookie
        response.set_cookie(
            key="refresh_token",
            value="test",
            httponly=True,
            path="/",
            secure=True if get_deployment_env() == AWS_DEPLOYMENT_ENV else False,
            samesite="lax",
        )

        return create_token_for_user(payload)

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
        encoded_jwt = jwt.encode(to_encode, get_jwt_secret(), algorithm=ALGORITHM)
    except jose.JWTError as e:
        logging.error(e)
        raise e
    return encoded_jwt


def create_token_for_user(payload: GoogleOauthPayload):
    return create_access_token(data={"sub": payload.sub, "email": payload.email})
