import logging
from datetime import datetime
from typing import Optional, Union

from boto3.dynamodb.conditions import Key

from fastapi import Cookie

from plant_api.constants import (
    CREDENTIALS_EXCEPTION,
)
from plant_api.schema import User, SessionTokenItem
from plant_api.utils.db import get_db_table, get_user_by_google_id
from plant_api.constants import SESSION_TOKEN_KEY

LOGGER = logging.getLogger(__name__)


def get_session_token(token_id: Optional[str]) -> SessionTokenItem:
    if not token_id:
        raise CREDENTIALS_EXCEPTION
    table = get_db_table()
    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"SESSION_TOKEN#{token_id}"),
    )
    if not response["Items"]:
        raise CREDENTIALS_EXCEPTION
    return SessionTokenItem(**response["Items"][0])


def get_current_user_session(session_token: Union[str, None] = Cookie(default=None, alias=SESSION_TOKEN_KEY)) -> User:
    """Returns the user from the session cookie if they're a valid user and the session is not expired."""
    LOGGER.info("Attempting to validate credentials...")
    LOGGER.info(f"Session Cookie: {session_token}")

    session_token_item = get_session_token(session_token)

    if session_token_item.revoked:
        LOGGER.error("Session token is revoked.")
        raise CREDENTIALS_EXCEPTION
    if session_token_item.expires_at < datetime.utcnow():
        LOGGER.error("Session token is expired.")
        raise CREDENTIALS_EXCEPTION

    user_item = get_user_by_google_id(session_token_item.user_id)

    LOGGER.info(f"User item: {user_item}")
    if not user_item:
        LOGGER.error("User in JWT payload not an authorized user in database.")
        raise CREDENTIALS_EXCEPTION
    if user_item.disabled:
        LOGGER.error("Credentialed email not an authorized user in database.")
        raise CREDENTIALS_EXCEPTION
    return User(email=user_item.email, google_id=user_item.google_id, disabled=user_item.disabled)
