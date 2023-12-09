from typing import Annotated, Optional

import uvicorn
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from mangum import Mangum
from fastapi.requests import Request

from backend.utils.auth import (
    TOKEN_URL,
    User,
    UserInDB,
    authenticate_user_password,
    create_access_token,
    fake_hash_password,
    fake_users_db,
    get_current_active_user,
    get_current_user,
    oauth2_scheme,
)
from backend.utils.constants import PLANTS_TABLE_NAME
from backend.utils.db import get_images_for_plant, get_plant_by_id, scan_table
from backend.utils.s3 import assign_presigned_url_to_img

app = FastAPI()


origins = [
    "http://localhost",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post(f"/{TOKEN_URL}")
def login(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    """API call to get token for a user from a username and password"""
    user = authenticate_user_password(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=400,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username})

    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
def read_users_me(current_user: Annotated[User, Depends(get_current_user)]):
    """API call to gets the current user from the token"""
    return current_user


@app.get("/")
def root(token: Annotated[str, Depends(oauth2_scheme)]):
    return {"token": token}


@app.get("/plants")
def get_all_plants(request: Request):
    plants = scan_table(PLANTS_TABLE_NAME)
    return {"message": plants}


@app.get("/plants/{plant_id}")
def get_plant(request: Request, plant_id: str):
    plant = get_plant_by_id(plant_id)
    return {"message": plant}


# Make a function to get all images for a plant
@app.get("/plants/{plant_id}/images")
def get_plant_images(request: Request, plant_id: str):
    images = get_images_for_plant(plant_id)
    for image in images:
        assign_presigned_url_to_img(image)
    return {"message": images}


handler = Mangum(app)

# For debugging, run this instead of from console
if __name__ == "__main__":
    uvicorn.run(app, host="localhost", port=8000)
