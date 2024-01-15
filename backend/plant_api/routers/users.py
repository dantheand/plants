from plant_api.routers.common import BaseRouter

from plant_api.dependencies import get_current_user
from fastapi import Depends

from plant_api.schema import UserItem
from plant_api.utils.db import get_all_active_users

router = BaseRouter(
    prefix="/users",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=list[UserItem])
async def get_users():
    return get_all_active_users()
