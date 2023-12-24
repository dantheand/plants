import io
import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile

from backend.plant_api.constants import NEW_PLANT_IMAGES_FOLDER, S3_BUCKET_NAME
from backend.plant_api.dependencies import get_current_user
from backend.plant_api.utils.db import get_db_table
from backend.plant_api.utils.s3 import get_s3_client
from backend.plant_api.utils.schema import EntityType, ImageBase, ImageItem
from PIL import Image

router = APIRouter(
    prefix="/new_images",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)

MAX_X_PIXELS = 200


def create_thumbnail(image: Image, max_x_size=MAX_X_PIXELS) -> Image:
    """Resize images (while maintaining aspect) to a max value of pixels on the x-axis"""
    original_x_len = image.width
    ratio = max_x_size / float(original_x_len)
    new_size = tuple([int(x * ratio) for x in image.size])
    if new_size[0] < max_x_size:
        logging.warning(f"Image is already smaller than {max_x_size} pixels on the x-axis")
        return image
    resized_image = image.resize(new_size, Image.Resampling.LANCZOS)
    return resized_image


@router.get("/{plant_id}")
async def get_images_for_plant(plant_id: UUID, user=Depends(get_current_user)):
    ...


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


@router.post("/{plant_id}", response_model=ImageItem)
async def create_image(plant_id: UUID, image_file: UploadFile, user=Depends(get_current_user)):

    image_id = uuid4()
    image_content = await image_file.read()

    # Save Original to S3
    image = Image.open(io.BytesIO(image_content))
    original_s3_path = upload_image_to_s3(image, image_id, plant_id, "original")

    # Create thumbnail and save to S3
    if image.width > MAX_X_PIXELS:
        ratio = MAX_X_PIXELS / float(image.width)
        new_size = tuple([int(x * ratio) for x in image.size])
        thumbnail = image.resize(new_size, Image.Resampling.LANCZOS)
    else:
        logging.warning(f"Image {image_id} is already smaller than {MAX_X_PIXELS} pixels on the x-axis")
        thumbnail = image
    thumbnail_s3_path = upload_image_to_s3(thumbnail, image_id, plant_id, "thumb")

    # Save reference to DynamoDB
    image_item = ImageItem(
        PK=f"PLANT#{plant_id}",
        SK=f"IMAGE#{image_id}",
        entity_type=EntityType.IMAGE,
        full_photo_s3_url=original_s3_path,
        thumbnail_photo_s3_url=thumbnail_s3_path,
    )
    table = get_db_table()
    table.put_item(Item=image_item.dynamodb_dump())
    return image_item


@router.post("/{plant_id}")
async def create_image_for_plant(
    plant_id: UUID, image_file: UploadFile, user=Depends(get_current_user), background_tasks=BackgroundTasks
):
    background_tasks.add_task(create_thumbnail, image_file)
    ...


@router.delete("/{plant_id}")
async def delete_image_for_plant(plant_id: UUID, image_id: UUID, user=Depends(get_current_user)):
    ...


def create_thumbnail(image_file):
    ...
