import logging
import uuid
from datetime import datetime, timedelta
from typing import Annotated, Optional


import jose
from fastapi import Depends
from google.auth.transport import requests
from google.oauth2 import id_token
from jose import jwt
from starlette.requests import Request

from plant_api.constants import (
    ALGORITHM,
    CREDENTIALS_EXCEPTION,
    GOOGLE_CLIENT_ID,
    GoogleOauthPayload,
    JwtPayload,
    TOKEN_URL,
    get_jwt_secret,
)
from plant_api.dependencies import get_current_user_session
from plant_api.routers.common import BaseRouter
from plant_api.schema import EntityType, ItemKeys, UserItem
from plant_api.utils.db import get_db_table, get_user_by_google_id
from plant_api.schema import User

ACCESS_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60

router = BaseRouter()

LOGGER = logging.getLogger(__name__)


@router.get("/check_token", response_model=User)
async def check_valid_user_token(user: Annotated[User, Depends(get_current_user_session)]) -> User:
    return user


@router.post(f"/{TOKEN_URL}")
async def auth(request: Request):
    """Authenticates a users oauth2 token and returns a JWT access token and sets a refresh token cookie"""
    body = await request.json()
    token = body.get("token")
    nonce = body.get("nonce")
    try:
        id_info = id_token.verify_oauth2_token(token, requests.Request(), GOOGLE_CLIENT_ID)
        if not id_info:
            LOGGER.error("Could not verify id token: %s", id_info)
            raise CREDENTIALS_EXCEPTION
        if nonce != id_info["nonce"]:
            LOGGER.error("Invalid nonce: %s", nonce)
            raise CREDENTIALS_EXCEPTION
        payload = GoogleOauthPayload(**id_info)

        # Check to see if the user exists in the DB
        user = get_user_by_google_id(payload.sub)
        if not user:
            # If user doesn't exist add them to DB with "disabled" set to True then fail login
            add_new_user_to_db(payload)
            LOGGER.info("Adding new user to DB: %s", payload.email)
            raise CREDENTIALS_EXCEPTION

        # If user does exist, make sure they are not disabled and then return tokens
        if user.disabled:
            LOGGER.info("User is disabled: %s", payload.email)
            raise CREDENTIALS_EXCEPTION

        token = create_access_token_for_user(payload)
        return {"token": token}

    except Exception as e:
        logging.error(e)
        raise CREDENTIALS_EXCEPTION


@router.get("/logout")
async def logout():
    """Place holder for logout. Doesn't do anything because the frontend handles login state."""
    return {"message": "Logged out"}


# TODO: pull in firstname last name
def add_new_user_to_db(google_oauth_payload: GoogleOauthPayload):
    """Adds a new user to the DB"""
    user_item = UserItem(
        PK=f"{ItemKeys.USER.value}#{google_oauth_payload.sub}",
        SK=f"{ItemKeys.USER.value}#{google_oauth_payload.sub}",
        email=google_oauth_payload.email,
        google_id=google_oauth_payload.sub,
        entity_type=EntityType.USER,
        disabled=True,
    )
    _ = get_db_table().put_item(Item=user_item.dynamodb_dump())


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Creates a signed JWT token with the given data and expiration time"""
    to_encode = data.copy()
    if expires_delta is None:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    else:
        expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    to_encode.update({"jti": str(uuid.uuid4())})
    try:
        encoded_jwt = jwt.encode(JwtPayload(**to_encode).model_dump(), get_jwt_secret(), algorithm=ALGORITHM)
    except jose.JWTError as e:
        logging.error(e)
        raise e
    return encoded_jwt


def create_access_token_for_user(payload: GoogleOauthPayload) -> str:
    return create_access_token(data={"google_id": payload.sub, "email": payload.email})
