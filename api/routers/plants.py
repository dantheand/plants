import logging

from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Depends
from pydantic import TypeAdapter

from api.constants import IMAGES_TABLE_NAME, PLANTS_TABLE_NAME
from api.dependencies import get_current_user
from api.utils.db import get_db_connection, scan_table
from api.utils.s3 import assign_presigned_url_to_img
from api.utils.schema import Image, Plant

router = APIRouter(
    prefix="/plants",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/")
def get_all_plants():
    logging.info("Getting all plants...")
    # TODO: validate the response once I've fixed up the DB to have the right types
    # adapter = TypeAdapter(list[Plant])
    # plants_list = adapter.validate_python(scan_table(PLANTS_TABLE_NAME))
    plants_list = scan_table(PLANTS_TABLE_NAME)
    return plants_list


@router.get("/{plant_id}")
def get_plant(plant_id: str) -> Plant:
    session = get_db_connection()
    table = session.Table(PLANTS_TABLE_NAME)
    response = table.get_item(Key={"PlantID": plant_id})
    return Plant(**response.get("Item"))


# Make a function to get all images for a plant
@router.get("/{plant_id}/images")
def get_plant_images(plant_id: str) -> list[Image]:
    images = get_images_for_plant(plant_id)
    for image in images:
        assign_presigned_url_to_img(image)
    return images


def get_images_for_plant(plant_id: str) -> list[Image]:
    session = get_db_connection()
    table = session.Table(IMAGES_TABLE_NAME)
    # TODO: sort by timestamp
    response = table.scan(FilterExpression=Key("PlantID").eq(plant_id))
    return [Image.model_validate(image) for image in response["Items"]]
