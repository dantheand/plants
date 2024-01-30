from plant_api.routers.common import BaseRouter

from plant_api.dependencies import get_current_user_session
from fastapi import Depends

from plant_api.schema import User, UserItem
from plant_api.utils.db import get_all_active_users, get_n_plants_for_user

router = BaseRouter(
    prefix="/users",
    dependencies=[Depends(get_current_user_session)],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=list[User])
async def get_users():
    # TODO: add get number of images for user and add to user return
    users = get_all_active_users()
    for user in users:
        total_plants, active_plants = get_n_plants_for_user(user)
        user.n_total_plants = total_plants
        user.n_active_plants = active_plants
    return users
