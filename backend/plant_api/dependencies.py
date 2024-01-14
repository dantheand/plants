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

# TODO: figure out what magic this is doing may be able to replace with OpenIdConnect()
oauth2_google = OAuth2PasswordBearer(
    tokenUrl=TOKEN_URL,
)


async def get_current_user(token: Annotated[str, Depends(oauth2_google)]) -> User:
    """Returns the user from the token if they are a valid user."""
    try:
        logging.info("Attempting to validate credentials...")
        payload = JwtPayload(**jwt.decode(token, get_jwt_secret(), algorithms=[ALGORITHM]))
    except ValidationError:
        logging.error("Encountered error validating credential format.")
        raise CREDENTIALS_EXCEPTION
    except jose.JWTError:
        logging.error("Encountered error decoding credentials.")
        raise CREDENTIALS_EXCEPTION

    user = User(
        email=payload.email,
        google_id=payload.google_id,
    )
    if not valid_email_from_db(user.email):
        logging.error("Credentialed email not an authorized user in database.")
        raise CREDENTIALS_EXCEPTION

    return user


def valid_email_from_db(email):
    users = [user for user in DB_PLACEHOLDER if user["email"] == email]

    user = User(**users[0]) if users else None

    return not user.disabled


# Make this a real DB that gets entries when a user tries to login for the first time
DB_PLACEHOLDER = [
    User(email="dan.the.anderson@gmail.com", google_id="106821357176702886816", disabled=False).model_dump(),
    User(email="zac.swider@gmail.com", google_id="108371166449203372992", disabled=False).model_dump(),
]
