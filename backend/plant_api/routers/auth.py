import logging
import uuid
from datetime import datetime, timedelta
from typing import Annotated, Optional, Tuple, Union

from boto3.dynamodb.conditions import Key

import jose
from fastapi import Cookie, Depends, Response
from google.auth.transport import requests
from google.oauth2 import id_token
from jose import jwt
from starlette.requests import Request

from plant_api.constants import SESSION_TOKEN_KEY
from plant_api.constants import (
    ALGORITHM,
    AWS_DEPLOYMENT_ENV,
    CREDENTIALS_EXCEPTION,
    GOOGLE_CLIENT_ID,
    GoogleOauthPayload,
    JwtPayload,
    TOKEN_URL,
    get_jwt_secret,
)
from plant_api.dependencies import get_current_user_session, get_session_token
from plant_api.routers.common import BaseRouter
from plant_api.schema import EntityType, ItemKeys, SessionTokenItem, UserItem
from plant_api.utils.deployment import get_deployment_env
from plant_api.utils.db import get_db_table, get_user_by_google_id
from plant_api.schema import User

ACCESS_TOKEN_EXPIRE_MINUTES = 30
SESSION_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60

router = BaseRouter()

LOGGER = logging.getLogger(__name__)


@router.get("/check_token", response_model=User)
async def check_valid_user_token(user: Annotated[User, Depends(get_current_user_session)]) -> User:
    return user


def set_session_token_cookie(response: Response, token_id: str):
    response.set_cookie(
        key=SESSION_TOKEN_KEY,
        value=token_id,
        httponly=True,
        path="/",
        secure=True if get_deployment_env() == AWS_DEPLOYMENT_ENV else False,
        samesite="lax",
    )


def generate_and_save_session_token(user: UserItem) -> str:
    """Generates a session token for the user and saves it to the DB"""
    token_item = SessionTokenItem(
        PK=f"{ItemKeys.SESSION_TOKEN}#{uuid.uuid4()}",
        SK=f"{ItemKeys.USER}#{user.google_id}",
        entity_type=EntityType.REFRESH_TOKEN,
        issued_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(minutes=SESSION_TOKEN_EXPIRE_MINUTES),
    )
    add_session_token_to_db(token_item)
    return token_item.token_id


@router.post(f"/{TOKEN_URL}")
async def auth(request: Request, response: Response):
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

        new_refresh_token = generate_and_save_session_token(user)
        set_session_token_cookie(response, new_refresh_token)
        token, _ = create_access_token_for_user(payload)
        return token

    except Exception as e:
        logging.error(e)
        raise CREDENTIALS_EXCEPTION


@router.get("/logout")
async def logout(response: Response, session_token: Union[str, None] = Cookie(default=None, alias=SESSION_TOKEN_KEY)):
    """Logs out the user by revoking their refresh token"""
    if not session_token:
        return
    session_token_item = get_session_token(session_token)
    revoke_session_token(session_token_item)
    response.delete_cookie(key=SESSION_TOKEN_KEY, path="/")


def revoke_session_token(token: SessionTokenItem):
    """Invalidates the refresh token"""
    _ = get_db_table().update_item(
        Key={"PK": token.PK, "SK": token.SK},
        UpdateExpression="SET revoked = :revoked",
        ExpressionAttributeValues={
            ":revoked": True,
        },
    )


def add_session_token_to_db(token: SessionTokenItem):
    """Adds a refresh token to the DB"""
    _ = get_db_table().put_item(Item=token.dynamodb_dump())


def add_new_user_to_db(google_oauth_payload: GoogleOauthPayload):
    """Adds a new user to the DB"""
    user_item = UserItem(
        PK=f"{ItemKeys.USER}#{google_oauth_payload.sub}",
        SK=f"{ItemKeys.USER}#{google_oauth_payload.sub}",
        email=google_oauth_payload.email,
        google_id=google_oauth_payload.sub,
        entity_type=EntityType.USER,
        disabled=True,
    )
    _ = get_db_table().put_item(Item=user_item.dynamodb_dump())


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> Tuple[str, datetime]:
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
    return encoded_jwt, expire


def create_refresh_token_for_user(payload: GoogleOauthPayload) -> Tuple[str, datetime]:
    return create_access_token(
        data={"google_id": payload.sub, "email": payload.email},
        expires_delta=timedelta(minutes=SESSION_TOKEN_EXPIRE_MINUTES),
    )


def create_access_token_for_user(payload: GoogleOauthPayload) -> Tuple[str, datetime]:
    return create_access_token(data={"google_id": payload.sub, "email": payload.email})


def create_token_for_user(
    payload: GoogleOauthPayload, expires_delta: Optional[timedelta] = None
) -> Tuple[str, datetime]:
    return create_access_token(data={"google_id": payload.sub, "email": payload.email}, expires_delta=expires_delta)
