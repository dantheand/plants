import os
from typing import Annotated, Optional

from authlib.integrations.httpx_client import OAuth2Client

import requests
import uvicorn
from authlib.integrations.base_client import OAuthError
from authlib.integrations.starlette_client import OAuth
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from google.auth import jwt
from google.oauth2 import id_token
from jose import JWTError
from google.auth.transport import requests

from mangum import Mangum
from fastapi.requests import Request
from starlette.middleware.sessions import SessionMiddleware
from starlette.responses import JSONResponse, RedirectResponse
from starlette.config import Config

from backend.utils.auth import (
    CREDENTIALS_EXCEPTION,
    TOKEN_URL,
    Token,
    User,
    create_access_token,
    create_token_for_email,
    get_current_user_email,
    oauth2_scheme,
    valid_email_from_db,
)
from backend.utils.constants import BASE_URL, PLANTS_TABLE_NAME
from backend.utils.db import get_images_for_plant, get_plant_by_id, scan_table
from backend.utils.s3 import assign_presigned_url_to_img

app = FastAPI()


origins = ["http://localhost", "http://localhost:3000", "localhost:3000", "localhost", "http://localhost:3000/"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# @app.post(f"/{TOKEN_URL}", response_model=Token)
# def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
#     """API call to get token for a user from a username and password"""
#     user = authenticate_user_password(fake_users_db, form_data.username, form_data.password)
#     if not user:
#         raise HTTPException(
#             status_code=400,
#             detail="Incorrect username or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
#     access_token = create_access_token(data={"sub": user.username})
#
#     return {"access_token": access_token, "token_type": "bearer"}


config = Config(".env")
oauth = OAuth(config)
oauth.register(
    name="google",
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

load_dotenv()
app.add_middleware(SessionMiddleware, secret_key=os.getenv("JWT_SIGNING_KEY"))


@app.get("/login")
async def login(request: Request):
    redirect_uri = request.url_for("auth")
    return await oauth.google.authorize_redirect(request, redirect_uri)


@app.post("/auth")
async def auth(request: Request):

    body = await request.json()
    token = body.get("token")
    request = requests.Request()
    try:
        id_info = id_token.verify_oauth2_token(
            token, request, "323044269310-jpacaee5fqigd05rolak62uto6mfnmcb.apps.googleusercontent.com"
        )
        if not id_info:
            raise CREDENTIALS_EXCEPTION
        return create_token_for_email(id_info["email"])
    except Exception as e:
        print(e)
        raise CREDENTIALS_EXCEPTION


@app.get("/")
def root(token: Annotated[str, Depends(oauth2_scheme)]):
    return {"token": token}


@app.get("/plants")
def get_all_plants(current_user: Annotated[User, Depends(get_current_user_email)]):
    plants = scan_table(PLANTS_TABLE_NAME)
    return {"message": plants}


@app.get("/plants/{plant_id}")
def get_plant(current_user: Annotated[User, Depends(get_current_user_email)], plant_id: str):
    plant = get_plant_by_id(plant_id)
    return {"message": plant}


# Make a function to get all images for a plant
@app.get("/plants/{plant_id}/images")
def get_plant_images(current_user: Annotated[User, Depends(get_current_user_email)], plant_id: str):
    images = get_images_for_plant(plant_id)
    for image in images:
        assign_presigned_url_to_img(image)
    return {"message": images}


handler = Mangum(app)

# For debugging, run this instead of from console
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
