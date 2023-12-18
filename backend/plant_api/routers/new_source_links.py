from uuid import UUID

from fastapi import APIRouter, Depends

from backend.plant_api.dependencies import get_current_user

router = APIRouter(
    prefix="/new_source_links",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/{plant_id}")
async def get_source_links_for_plant(plant_id: UUID, user=Depends(get_current_user)):
    ...


@router.post("/{child_plant_id}")
async def create_source_link_for_plant(child_plant_id: UUID, source_id: UUID, user=Depends(get_current_user)):
    ...


@router.delete("/{plant_id}")
async def delete_source_link_for_plant(child_plant_id: UUID, source_id: UUID, user=Depends(get_current_user)):
    ...
