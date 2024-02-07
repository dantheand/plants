import asyncio
import aioboto3
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

from plant_api.constants import ACCESS_NOT_ALLOWED_EXCEPTION, AWS_REGION, IMAGES_FOLDER, S3_BUCKET_NAME, TABLE_NAME
from plant_api.dependencies import get_current_user_session
from plant_api.routers.common import BaseRouter
from plant_api.utils.db import (
    get_db_table,
    make_image_query_key,
    query_by_image_id,
    query_by_plant_id,
)
from plant_api.utils.s3 import (
    create_async_presigned_thumbnail_url,
    create_presigned_urls_for_image,
    get_s3_client,
)
from plant_api.schema import EntityType, ImageItem, User
from PIL import Image as img, ImageOps
from PIL.Image import Image

from fastapi import Form

from plant_api.routers.users import is_user_access_allowed

logger = logging.getLogger(__name__)


router = BaseRouter(
    prefix="/images",
    dependencies=[Depends(get_current_user_session)],
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


def get_images_for_plant(plant_id: UUID) -> list[ImageItem]:
    table = get_db_table()

    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"PLANT#{plant_id}") & Key("SK").begins_with("IMAGE#"),
    )
    return TypeAdapter(list[ImageItem]).validate_python(response["Items"])


async def get_async_images_for_plant(session, plant_id: UUID) -> list[ImageItem]:
    async with session.resource("dynamodb", region_name=AWS_REGION) as dynamodb:
        table = await dynamodb.Table(TABLE_NAME)
        response = await table.query(
            KeyConditionExpression=Key("PK").eq(f"PLANT#{plant_id}") & Key("SK").begins_with("IMAGE#"),
        )
        return TypeAdapter(list[ImageItem]).validate_python(response["Items"])


async def get_async_most_recent_image_for_plant(session, plant_id: UUID) -> Optional[ImageItem]:
    logger.debug(f"Fetching most recent image for plant {plant_id}")
    images = await get_async_images_for_plant(session, plant_id)
    # Sort images by timestamp
    images.sort(key=lambda x: x.timestamp, reverse=True)
    return images[0] if images else None


@router.get("/plants/{plant_id}", response_model=list[ImageItem])
async def get_all_images_for_plant(plant_id: UUID, user=Depends(get_current_user_session)) -> list[ImageItem]:
    # I loathe to make this query slower by adding another DB call...
    #    but it's necessary to check if the user has access to the plant
    plant = query_by_plant_id(get_db_table(), plant_id)
    if not is_user_access_allowed(user, plant.user_id):
        raise ACCESS_NOT_ALLOWED_EXCEPTION
    images = get_images_for_plant(plant_id)
    if not images:
        raise HTTPException(status_code=404, detail="Could not find images for plant.")

    for image in images:
        create_presigned_urls_for_image(image)

    return images


# TODO: write tests for this route
@router.post("/plants/most_recent", response_model=list[Optional[ImageItem]])
async def get_plants_most_recent_image(
    plant_ids: list[UUID], user=Depends(get_current_user_session)
) -> list[ImageItem]:
    """Returns a list of the most recent image for plant ids provided in the request body"""

    session = aioboto3.Session()

    async def fetch_image(plant_id: UUID):
        image = await get_async_most_recent_image_for_plant(session, plant_id)
        if image:
            await create_async_presigned_thumbnail_url(session, image)
        return image

    # Use asyncio.gather to run fetch_image concurrently for each plant_id
    images = await asyncio.gather(*(fetch_image(plant_id) for plant_id in plant_ids))

    return [image for image in images if image]


# TODO: cleanup routes: /images/plant/<plant_id>
#   /images/image/<image_id>
@router.get("/{image_id}", response_model=ImageItem)
async def get_image(image_id: UUID):
    table = get_db_table()
    image_response = query_by_image_id(table, image_id)
    return image_response


@router.post("/plants/{plant_id}", response_model=ImageItem)
async def create_image(
    plant_id: UUID,
    image_file: Annotated[UploadFile, File()],
    user=Depends(get_current_user_session),
    timestamp: Annotated[Optional[datetime], Form()] = None,
):

    # Check if plant exists
    table = get_db_table()
    response = table.get_item(Key={"PK": f"USER#{user.google_id}", "SK": f"PLANT#{plant_id}"})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Coul not find plant to attach image to for user.")

    image_id = uuid4()
    image_content = await image_file.read()

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
async def delete_image(image_id: UUID, user=Depends(get_current_user_session)):
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
async def update_image(image_id: UUID, new_data: ImageItem, user=Depends(get_current_user_session)):
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

    table.put_item(Item=updated_item.dynamodb_dump())
    return updated_item
