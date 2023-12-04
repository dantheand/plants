import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from mangum import Mangum
from fastapi.requests import Request

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


@app.get("/")
def root():
    return {"message": "Hello World"}


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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
