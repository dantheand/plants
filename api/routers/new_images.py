from uuid import UUID, uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile

from api.dependencies import get_current_user
from api.utils.db import get_db_table
from api.utils.schema import ImageBase, ImageItem

router = APIRouter(
    prefix="/new_images",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/{plant_id}")
async def get_images_for_plant(plant_id: UUID, user=Depends(get_current_user)):
    ...


@router.post("/{plant_id}")
async def create_image(image_data: ImageBase, image_file: UploadFile, user=Depends(get_current_user)):
    image_id = uuid4()
    image_item = ImageItem(
        PK=f"PLANT#{image_data.plant_id}",
        SK=f"IMAGE#{image_id}",
        entity_type="Image",
        **image_data.model_dump(),
    )

    # Save to S3

    table = get_db_table()
    table.put_item(Item=image_item.model_dump(by_alias=True))
    return {"message": "Image added successfully", "image_id": image_id}


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
