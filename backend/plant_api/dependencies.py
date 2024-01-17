import logging
from typing import Annotated

import jose
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError

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


async def get_current_user(token: Annotated[str, Depends(oauth2_google)]) -> User:
    """Returns the user from the token if they are a valid user."""
    try:
        LOGGER.info("Attempting to validate credentials...")
        LOGGER.info(f"Token: {token}")
        payload = JwtPayload(**jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM]))
    except ValidationError:
        LOGGER.error("Encountered error validating credential format.")
        raise CREDENTIALS_EXCEPTION
    except jose.JWTError:
        LOGGER.error("Encountered error decoding credentials.")
        raise CREDENTIALS_EXCEPTION

    user_item = get_user_by_google_id(payload.google_id)
    LOGGER.info(f"User item: {user_item}")
    if not user_item:
        LOGGER.error("User in JWT payload not an authorized user in database.")
        raise CREDENTIALS_EXCEPTION
    if user_item.disabled:
        LOGGER.error("Credentialed email not an authorized user in database.")
        raise CREDENTIALS_EXCEPTION
    return User(email=user_item.email, google_id=user_item.google_id, disabled=user_item.disabled)
