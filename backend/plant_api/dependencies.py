import logging
from typing import Annotated

import jose
from fastapi import Depends, Security
from fastapi.security import APIKeyHeader, OAuth2AuthorizationCodeBearer, OAuth2PasswordBearer
from jose import jwt
from pydantic import ValidationError

from backend.plant_api.constants import (
    ALGORITHM,
    BASE_URL,
    CREDENTIALS_EXCEPTION,
    GoogleOauthPayload,
    TOKEN_URL,
    get_jwt_secret,
)
from backend.plant_api.utils.schema import User

# TODO: figure out what magic this is doing may be able to replace with OpenIdConnect()
oauth2_google = OAuth2PasswordBearer(
    tokenUrl=TOKEN_URL,
)


async def get_current_user(token: Annotated[str, Depends(oauth2_google)]) -> User:
    """Returns the user from the token if they are a valid user."""
    try:
        logging.info("Attempting to validate credentials...")
        payload = GoogleOauthPayload(**jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM]))
    except ValidationError:
        logging.error("Encountered error validating credential format.")
        raise CREDENTIALS_EXCEPTION
    except jose.JWTError:
        logging.error("Encountered error decoding credentials.")
        raise CREDENTIALS_EXCEPTION

    user = User(
        email=payload.email,
        google_id=payload.sub,
    )
    if not valid_email_from_db(user.email):
        logging.error("Credentialed email not an authorized user in database.")
        raise CREDENTIALS_EXCEPTION

    return user


def valid_email_from_db(email):
    return email in FAKE_DB


FAKE_DB = ["dan.the.anderson@gmail.com"]
