import logging

from fastapi import APIRouter, Depends

from api.constants import PLANTS_TABLE_NAME
from api.dependencies import get_current_user_email
from api.utils.db import get_images_for_plant, get_plant_by_id, scan_table
from api.utils.s3 import assign_presigned_url_to_img

router = APIRouter(
    prefix="/plants",
    dependencies=[Depends(get_current_user_email)],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
def get_all_plants():
    logging.info("Getting all plants...")
    plants_list = scan_table(PLANTS_TABLE_NAME)
    return {"message": plants_list}


@router.get("/{plant_id}")
def get_plant(plant_id: str):
    plant = get_plant_by_id(plant_id)
    return {"message": plant}


# Make a function to get all images for a plant
@router.get("/{plant_id}/images")
def get_plant_images(plant_id: str):
    images = get_images_for_plant(plant_id)
    for image in images:
        assign_presigned_url_to_img(image)
    return {"message": images}
