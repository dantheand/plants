from fastapi import HTTPException
from starlette import status

from api.utils.aws import get_aws_secret

PLANTS_TABLE_NAME = "plants"
IMAGES_TABLE_NAME = "images"

S3_BUCKET_NAME = "0bf665f0db5b-plant-app"
PLANT_IMAGES_FOLDER = "images"

BASE_URL = "http://localhost:8000"
DEPLOYED_BASE_URL = "https://master.d1g3nlvs6mpirt.amplifyapp.com/prod"
GOOGLE_CLIENT_ID = "323044269310-jpacaee5fqigd05rolak62uto6mfnmcb.apps.googleusercontent.com"
TOKEN_URL = "token"
ALGORITHM = "HS256"
CREDENTIALS_EXCEPTION = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Could not validate credentials",
    headers={"WWW-Authenticate": "Bearer"},
)
JWT_SECRET_KEY = get_aws_secret("jwt_signing_key")
