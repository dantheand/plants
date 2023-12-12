import logging
from datetime import datetime, timedelta
from typing import Optional

from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException
from google.auth.transport import requests
from google.oauth2 import id_token
from jose import jwt
from pydantic import BaseModel
from starlette import status
from starlette.config import Config
from starlette.requests import Request


import boto3
from botocore.exceptions import ClientError

from api.constants import DEPLOYED_BASE_URL, GOOGLE_CLIENT_ID

# TODO: store all credentials except AWS credentials in S3 and pull them using aws sdk
load_dotenv(".env")
config = Config(".env")
oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


def get_aws_secret():
    secret_name = "jwt_signing_key"
    region_name = "us-west-2"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager", region_name=region_name)

    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        raise e

    # Decrypts secret using the associated KMS key.
    secret = get_secret_value_response["SecretString"]
    return secret


JWT_SECRET_KEY = get_aws_secret()


class User(BaseModel):
    email: Optional[str] = None
    disabled: Optional[bool] = None


CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)

router = APIRouter()


@router.post("/auth")
async def auth(request: Request):
    body = await request.json()
    token = body.get("token")
    nonce = body.get("nonce")
    request = requests.Request()
    try:
        id_info = id_token.verify_oauth2_token(token, request, GOOGLE_CLIENT_ID)
        # TODO: figure out how to verify nonce; it's not in the id_toekn
        if not id_info:
            logging.error("Could not verify id token: %s", id_info)
            raise CREDENTIALS_EXCEPTION
        return (create_token_for_email(id_info["email"]),)

    except Exception as e:
        logging.error(e)
        raise CREDENTIALS_EXCEPTION


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Creates a signed JWT token with the given data and expiration time"""
    to_encode = data.copy()
    # Set the expiration time
    if expires_delta is None:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    else:
        expire = datetime.utcnow() + expires_delta
    # Add the expiration time to the token
    to_encode.update({"exp": expire})
    # Encode the token
    try:
        encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=ALGORITHM)
    # Catch jwt encoding error
    except jwt.JWTError as e:
        logging.error(e)
        raise e
    return encoded_jwt


def create_token_for_email(email: str):
    return create_access_token(data={"sub": email})
