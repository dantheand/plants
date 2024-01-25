import logging
import uuid
from datetime import datetime, timedelta
from typing import Annotated, Optional, Tuple

from boto3.dynamodb.conditions import Key

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
    JwtPayload,
    TOKEN_URL,
    get_jwt_secret,
)
from plant_api.dependencies import get_current_user
from plant_api.routers.common import BaseRouter
from plant_api.schema import EntityType, ItemKeys, TokenItem, UserItem
from plant_api.utils.deployment import get_deployment_env
from plant_api.utils.db import get_db_table, get_user_by_google_id
from plant_api.schema import User

ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_MINUTES = 7 * 24 * 60

REFRESH_TOKEN = "refresh_token"

router = BaseRouter()

LOGGER = logging.getLogger(__name__)


@router.get("/check_token")
async def check_valid_user_token(user: Annotated[User, Depends(get_current_user)]) -> bool:
    if user:
        return True
    return False


def set_refresh_token_cookie(response: Response, token: str):
    response.set_cookie(
        key=REFRESH_TOKEN,
        value=token,
        httponly=True,
        path="/",
        secure=True if get_deployment_env() == AWS_DEPLOYMENT_ENV else False,
        samesite="lax",
    )


def generate_and_save_refresh_token(user: UserItem) -> str:
    """Generates a refresh token for the user and saves it to the DB"""
    token, expiration = create_refresh_token_for_user(GoogleOauthPayload(email=user.email, sub=user.google_id))
    token_item = TokenItem(
        PK=f"{ItemKeys.REFRESH_TOKEN.value}#{uuid.uuid4()}",
        SK=f"{ItemKeys.USER.value}#{user.google_id}",
        entity_type=EntityType.REFRESH_TOKEN,
        issued_at=datetime.utcnow(),
        expires_at=expiration,
    )
    add_refresh_token_to_db(token_item)
    return token


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

        new_refresh_token = generate_and_save_refresh_token(user)
        set_refresh_token_cookie(response, new_refresh_token)
        token, _ = create_access_token_for_user(payload)
        return token

    except Exception as e:
        logging.error(e)
        raise CREDENTIALS_EXCEPTION


@router.post("/refresh_token")
async def refresh_token(request: Request, response: Response):
    """Refreshes the access token for the user and returns a new refresh token cookie

    If the refresh token supplied has been used before, we're likely seeing a replay attack,
    so we revoke all refresh tokens for a user.

    See https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation
    """

    old_refresh_token = request.cookies.get(REFRESH_TOKEN)
    if not old_refresh_token:
        raise CREDENTIALS_EXCEPTION

    # Validate the old refresh token and then revoke it
    old_token_item = validate_refresh_token(old_refresh_token)
    revoke_refresh_token(old_token_item)
    # Create a new refresh token and access token for user
    user = get_user_by_google_id(old_token_item.user_id)
    if not user:
        raise CREDENTIALS_EXCEPTION

    new_access_token, _ = create_access_token_for_user(GoogleOauthPayload(email=user.email, sub=user.google_id))
    new_refresh_token, refresh_exp = create_refresh_token_for_user(
        GoogleOauthPayload(email=user.email, sub=user.google_id)
    )

    # Store the new refresh token in the DB
    token_item = TokenItem(
        PK=f"{ItemKeys.REFRESH_TOKEN.value}#{new_refresh_token}",
        SK=f"{ItemKeys.USER.value}#{user.google_id}",
        entity_type=EntityType.REFRESH_TOKEN,
        issued_at=datetime.utcnow(),
        expires_at=refresh_exp,
    )
    add_refresh_token_to_db(token_item)
    set_refresh_token_cookie(response, new_refresh_token)
    return new_access_token


def get_token_item_by_token(token: str) -> Optional[TokenItem]:
    """Returns the token item for the given token"""
    response = get_db_table().query(KeyConditionExpression=Key("PK").eq(f"{ItemKeys.REFRESH_TOKEN.value}#{token}"))
    if not response["Items"]:
        return None
    return TokenItem(**response["Items"][0])


def validate_refresh_token(token: str) -> TokenItem:
    """Validates the refresh token and returns True if it is valid"""
    token_in_db = get_token_item_by_token(token)
    if not token_in_db:
        raise CREDENTIALS_EXCEPTION

    # TODO cleanup getting datetime from token (use model dumps so we dont have to do this)
    if not token_in_db.revoked and token_in_db.expires_at > datetime.utcnow():
        return token_in_db
    raise CREDENTIALS_EXCEPTION


def revoke_refresh_token(token: TokenItem):
    """Invalidates the refresh token"""
    _ = get_db_table().update_item(
        Key={"PK": token.PK, "SK": token.SK},
        UpdateExpression="SET revoked = :revoked",
        ExpressionAttributeValues={
            ":revoked": True,
        },
    )


def add_refresh_token_to_db(token: TokenItem):
    """Adds a refresh token to the DB"""
    _ = get_db_table().put_item(Item=token.dynamodb_dump())


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
        expires_delta=timedelta(minutes=REFRESH_TOKEN_EXPIRE_MINUTES),
    )


def create_access_token_for_user(payload: GoogleOauthPayload) -> Tuple[str, datetime]:
    return create_access_token(data={"google_id": payload.sub, "email": payload.email})


def create_token_for_user(
    payload: GoogleOauthPayload, expires_delta: Optional[timedelta] = None
) -> Tuple[str, datetime]:
    return create_access_token(data={"google_id": payload.sub, "email": payload.email}, expires_delta=expires_delta)
