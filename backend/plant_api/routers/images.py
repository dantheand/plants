import io
import logging
from datetime import datetime
from enum import Enum
from typing import Annotated, Optional
from uuid import UUID, uuid4

from boto3.dynamodb.conditions import Key
from fastapi import Depends, File, HTTPException, UploadFile
from pydantic import TypeAdapter
from starlette import status

from plant_api.constants import IMAGES_FOLDER, S3_BUCKET_NAME
from plant_api.dependencies import get_current_user
from plant_api.routers.common import BaseRouter
from plant_api.utils.db import get_db_table, make_image_query_key, query_by_image_id, query_by_plant_id
from plant_api.utils.s3 import create_presigned_urls_for_image, get_s3_client
from plant_api.schema import EntityType, ImageItem
from PIL import Image as img, ImageOps
from PIL.Image import Image

from fastapi import Form

logger = logging.getLogger(__name__)
# logger.setLevel(logging.DEBUG)


router = BaseRouter(
    prefix="/images",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)

MAX_THUMB_X_PIXELS = 500


class ImageSuffixes(str, Enum):
    ORIGINAL = "original"
    THUMB = "thumb"


def make_s3_path_for_image(image_id: UUID, plant_id: UUID, image_suffix: str) -> str:
    return f"{IMAGES_FOLDER}/{plant_id}/{image_id}_{image_suffix}.jpg"


def upload_image_to_s3(image: Image, image_id: UUID, plant_id: UUID, image_suffix) -> str:
    s3_client = get_s3_client()

    buf = io.BytesIO()
    image.save(buf, format="JPEG")
    buf.seek(0)
    s3_path = make_s3_path_for_image(image_id, plant_id, image_suffix)
    s3_client.upload_fileobj(buf, S3_BUCKET_NAME, s3_path)
    return s3_path


@router.get("/plants/{plant_id}", response_model=list[ImageItem])
async def get_all_images_for_plant(plant_id: UUID, user=Depends(get_current_user)) -> list[ImageItem]:
    table = get_db_table()
    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"PLANT#{plant_id}") & Key("SK").begins_with("IMAGE#"),
    )
    # Catch the case where there are no images for this plant
    if "Items" not in response or response["Count"] == 0:
        raise HTTPException(status_code=404, detail="Could not find images for plant.")

    parsed_response = TypeAdapter(list[ImageItem]).validate_python(response["Items"])
    for image in parsed_response:
        create_presigned_urls_for_image(image)

    return parsed_response


# TODO: cleanup routes: /new_images/plant/<plant_id>
#   /new_images/image/<image_id>
@router.get("/{image_id}", response_model=ImageItem)
async def get_image(image_id: UUID, user=Depends(get_current_user)):
    table = get_db_table()
    image_response = query_by_image_id(table, image_id)
    return image_response


@router.post("/plants/{plant_id}", response_model=ImageItem)
async def create_image(
    plant_id: UUID,
    image_file: Annotated[UploadFile, File()],
    user=Depends(get_current_user),
    timestamp: Annotated[Optional[datetime], Form()] = None,
):

    # Check if plant exists
    table = get_db_table()
    response = table.get_item(Key={"PK": f"USER#{user.google_id}", "SK": f"PLANT#{plant_id}"})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Coul not find plant to attach image to for user.")

    image_id = uuid4()
    image_content = await image_file.read()

    # logger.info(f"Received file: {image_file.filename}, Content Type: {image_file.content_type}")
    # logger.info(f"File Size: {len(image_content)} bytes")
    # logger.debug(f"File Content (first 100 bytes): {image_content[:100]}")
    # logger.debug(f"File Content (last 100 bytes): {image_content[-100:]}")

    # Save Original to S3

    image = img.open(io.BytesIO(image_content))
    image = _orient_image(image)
    original_s3_path = upload_image_to_s3(image, image_id, plant_id, ImageSuffixes.ORIGINAL)

    # Create thumbnail and save to S3 (I tried to break this out into a separate function but it didn't work...)
    if image.width > MAX_THUMB_X_PIXELS:
        ratio = MAX_THUMB_X_PIXELS / float(image.width)
        new_size = (MAX_THUMB_X_PIXELS, int(image.height * ratio))
        thumbnail = image.resize(new_size, img.Resampling.LANCZOS)
    else:
        logger.info(f"Image {image_id} is already smaller than {MAX_THUMB_X_PIXELS} pixels on the x-axis")
        thumbnail = image
    thumbnail_s3_path = upload_image_to_s3(thumbnail, image_id, plant_id, ImageSuffixes.THUMB)

    if timestamp is None:
        timestamp = datetime.utcnow()

    # Save reference to DynamoDB
    image_item = ImageItem(
        PK=f"PLANT#{plant_id}",
        SK=f"IMAGE#{image_id}",
        entity_type=EntityType.IMAGE,
        full_photo_s3_url=original_s3_path,
        thumbnail_photo_s3_url=thumbnail_s3_path,
        timestamp=timestamp,
    )
    table.put_item(Item=image_item.dynamodb_dump())
    return image_item


def _orient_image(image: Image) -> Image:
    return ImageOps.exif_transpose(image)


def delete_image_from_s3(image: ImageItem):
    s3_client = get_s3_client()
    s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=image.full_photo_s3_url)
    s3_client.delete_object(Bucket=S3_BUCKET_NAME, Key=image.thumbnail_photo_s3_url)


@router.delete("/{image_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_image(image_id: UUID, user=Depends(get_current_user)):
    table = get_db_table()

    # Check if image exists
    image_response = query_by_image_id(table, image_id)
    if not image_response:
        raise HTTPException(status_code=404, detail="Could not find image for plant.")

    image_plant_id = UUID(image_response.PK.split("#")[1])

    # Check if user owns plant
    plant_response = query_by_plant_id(table, image_plant_id)
    if not plant_response:
        raise HTTPException(status_code=404, detail="Associated plant not found for image.")
    if plant_response.PK != f"USER#{user.google_id}":
        raise HTTPException(status_code=403, detail="User does not own plant.")

    delete_image_from_s3(image_response)

    table.delete_item(Key=make_image_query_key(image_plant_id, image_id))
    return {"message": "Image deleted successfully"}


@router.patch("/{image_id}", response_model=ImageItem)
async def update_image(image_id: UUID, new_data: ImageItem, user=Depends(get_current_user)):
    table = get_db_table()
    stored_item = query_by_image_id(table, image_id)

    # Check to make sure attached plant exists and belongs to user
    plant_response = query_by_plant_id(table, UUID(stored_item.PK.split("#")[1]))
    if not plant_response:
        raise HTTPException(status_code=404, detail="Associated plant not found for image.")
    if plant_response.PK != f"USER#{user.google_id}":
        raise HTTPException(status_code=403, detail="User does not own plant.")

    update_data = new_data.model_dump(exclude_unset=True)
    updated_item = stored_item.model_copy(update=update_data)

    table.put_item(Item=updated_item.model_dump())
    return updated_item