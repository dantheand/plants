from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Depends

from backend.plant_api.constants import IMAGES_TABLE_NAME, PLANTS_TABLE_NAME
from backend.plant_api.dependencies import get_current_user
from backend.plant_api.utils.db import get_db_connection, scan_table
from backend.plant_api.utils.s3 import assign_presigned_url_to_img
from backend.plant_api.utils.schema import Image

router = APIRouter(
    prefix="/images",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)


# Make a function to get all images for a plant
@router.get("/{plant_id}")
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
