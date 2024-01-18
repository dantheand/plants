from plant_api.routers.common import BaseRouter

from plant_api.dependencies import get_current_user
from fastapi import Depends

from plant_api.schema import User, UserItem
from plant_api.utils.db import get_all_active_users, get_n_plants_for_user

router = BaseRouter(
    prefix="/users",
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=list[User])
async def get_users():
    users = get_all_active_users()
    for user in users:
        user.n_plants = get_n_plants_for_user(user)
    return users
