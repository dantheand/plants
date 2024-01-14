from datetime import datetime
from uuid import UUID

from fastapi import HTTPException
from pydantic import BaseModel, Field
from starlette import status

from plant_api.utils.secrets import get_aws_secret

TABLE_NAME = "new_plants"

AWS_REGION = "us-west-2"
S3_BUCKET_NAME = "0bf665f0db5b-plant-app"
IMAGES_FOLDER = "new_images"

GOOGLE_CLIENT_ID = "323044269310-jpacaee5fqigd05rolak62uto6mfnmcb.apps.googleusercontent.com"
TOKEN_URL = "token"
ALGORITHM = "HS256"
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
JWT_KEY_IN_SECRETS_MANAGER = "jwt_signing_key"
DEPLOYMENT_ENV_VAR = "DEPLOYMENT_ENV"
LOCAL_DEPLOYMENT_ENV = "local"
AWS_DEPLOYMENT_ENV = "aws"


def get_jwt_secret() -> str:
    return get_aws_secret(JWT_KEY_IN_SECRETS_MANAGER)


class GoogleOauthPayload(BaseModel):
    email: str
    sub: str = Field(..., description="Google's unique identifier for the user.")


class JwtPayload(BaseModel):
    email: str
    google_id: str = Field(..., description="Google's unique identifier for the user.")
    exp: datetime = Field(..., description="Expiration time for the token.")
    jti: str = Field(..., description="Unique identifier for the token.")
