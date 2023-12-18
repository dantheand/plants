from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, UploadFile

from api.dependencies import get_current_user

router = APIRouter(
    prefix="/new_images",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/{plant_id}")
async def get_images_for_plant(plant_id: UUID, user=Depends(get_current_user)):
    ...


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
