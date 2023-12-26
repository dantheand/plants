import io
import logging
from enum import Enum
from uuid import UUID, uuid4

from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, UploadFile

from backend.plant_api.constants import NEW_PLANT_IMAGES_FOLDER, S3_BUCKET_NAME
from backend.plant_api.dependencies import get_current_user
from backend.plant_api.utils.db import get_db_table
from backend.plant_api.utils.s3 import get_s3_client
from backend.plant_api.utils.schema import EntityType, ImageBase, ImageItem
from PIL import Image as img
from PIL.Image import Image

router = APIRouter(
    prefix="/new_images",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)

MAX_X_PIXELS = 200


class ImageSuffixes(str, Enum):
    ORIGINAL = "original"
    THUMB = "thumb"


def make_s3_path_for_image(image_id: UUID, plant_id: UUID, image_suffix: str) -> str:
    return f"{NEW_PLANT_IMAGES_FOLDER}/{plant_id}/{image_id}_{image_suffix}.jpg"


def upload_image_to_s3(image: Image, image_id: UUID, plant_id: UUID, image_suffix) -> str:
    s3_client = get_s3_client()

    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    buf.seek(0)
    s3_path = make_s3_path_for_image(image_id, plant_id, image_suffix)
    s3_client.upload_fileobj(buf, S3_BUCKET_NAME, s3_path)
    return s3_path


@router.get("/{plant_id}", response_model=list[ImageItem])
async def get_all_images_for_plant(plant_id: UUID, user=Depends(get_current_user)):
    table = get_db_table()
    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"PLANT#{plant_id}") & Key("SK").begins_with("IMAGE#"),
    )
    # Catch the case where there are no images for this plant
    if "Items" not in response or response["Count"] == 0:
        raise HTTPException(status_code=404, detail="Could not find images for plant.")
    return response["Items"]


@router.get("/{plant_id}/{image_id}", response_model=ImageItem)
async def get_image_for_plant(plant_id: UUID, image_id: UUID, user=Depends(get_current_user)):
    table = get_db_table()
    response = table.get_item(Key={"PK": f"PLANT#{plant_id}", "SK": f"IMAGE#{image_id}"})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Could not find image for plant.")
    return response["Item"]


@router.post("/{plant_id}", response_model=ImageItem)
async def create_image(plant_id: UUID, image_file: UploadFile, user=Depends(get_current_user)):

    # Check if plant exists
    table = get_db_table()
    response = table.get_item(Key={"PK": f"USER#{user.google_id}", "SK": f"PLANT#{str(plant_id)}"})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Coul not find plant to attach image to for user.")

    image_id = uuid4()
    image_content = await image_file.read()

    # Save Original to S3
    image = img.open(io.BytesIO(image_content))
    original_s3_path = upload_image_to_s3(image, image_id, plant_id, ImageSuffixes.ORIGINAL)

    # Create thumbnail and save to S3 (I tried to break this out into a separate function but it didn't work...)
    if image.width > MAX_X_PIXELS:
        ratio = MAX_X_PIXELS / float(image.width)
        new_size = (MAX_X_PIXELS, int(image.height * ratio))
        thumbnail = image.resize(new_size, img.Resampling.LANCZOS)
    else:
        logging.warning(f"Image {image_id} is already smaller than {MAX_X_PIXELS} pixels on the x-axis")
        thumbnail = image
    thumbnail_s3_path = upload_image_to_s3(thumbnail, image_id, plant_id, ImageSuffixes.THUMB)

    # Save reference to DynamoDB
    image_item = ImageItem(
        PK=f"PLANT#{plant_id}",
        SK=f"IMAGE#{image_id}",
        entity_type=EntityType.IMAGE,
        full_photo_s3_url=original_s3_path,
        thumbnail_photo_s3_url=thumbnail_s3_path,
    )
    table.put_item(Item=image_item.dynamodb_dump())
    return image_item


@router.delete("/{plant_id}/{image_id}")
async def delete_image_for_plant(plant_id: UUID, image_id: UUID, user=Depends(get_current_user)):
    ...
