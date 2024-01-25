import logging
from datetime import datetime
from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

import jose
from jose import jwt

from plant_api.constants import (
    ALGORITHM,
    CREDENTIALS_EXCEPTION,
    JwtPayload,
    TOKEN_URL,
    get_jwt_secret,
)
from plant_api.schema import User
from plant_api.utils.db import get_user_by_google_id

LOGGER = logging.getLogger(__name__)


# TODO: figure out what magic this is doing may be able to replace with OpenIdConnect()
oauth2_google = OAuth2PasswordBearer(
    tokenUrl=TOKEN_URL,
)


def decode_jwt_token(token: str) -> JwtPayload:
    """Decodes a JWT token and returns the payload."""
    try:
        decoded_token = jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM])
        return JwtPayload(**decoded_token)
    except jose.JWTError as e:
        LOGGER.error("Could not decode JWT token: %s", e)
        raise CREDENTIALS_EXCEPTION


def get_current_user_session(session_token: Annotated[str, Depends(oauth2_google)]) -> User:
    """Returns the user from the session cookie if they're a valid user and the session is not expired."""
    LOGGER.info("Attempting to validate credentials...")

    decoded_token = decode_jwt_token(session_token)

    if decoded_token.exp < datetime.utcnow():
        LOGGER.error("Session token is expired.")
        raise CREDENTIALS_EXCEPTION

    user_item = get_user_by_google_id(decoded_token.google_id)

    LOGGER.info(f"User item: {user_item}")
    if not user_item:
        LOGGER.error("User in JWT payload not an authorized user in database.")
        raise CREDENTIALS_EXCEPTION
    if user_item.disabled:
        LOGGER.error("User is disabled!")
        raise CREDENTIALS_EXCEPTION
    return User(email=user_item.email, google_id=user_item.google_id, disabled=user_item.disabled)
