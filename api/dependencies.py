from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt

from api.routers.auth import ALGORITHM, CREDENTIALS_EXCEPTION, JWT_SECRET_KEY, User

TOKEN_URL = "auth"
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=TOKEN_URL)


async def get_current_user_email(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
    """Returns the user from the token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise CREDENTIALS_EXCEPTION
    except jwt.JWTError:
        raise CREDENTIALS_EXCEPTION

    user = User(email=email)
    if not valid_email_from_db(email):
        raise CREDENTIALS_EXCEPTION

    return user


def valid_email_from_db(email):
    return email in FAKE_DB


FAKE_DB = ["dan.the.anderson@gmail.com"]
