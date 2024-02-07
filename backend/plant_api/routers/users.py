from plant_api.routers.common import BaseRouter

from plant_api.dependencies import get_current_user_session
from fastapi import Depends

from plant_api.utils.db import get_all_active_users, get_n_plants_for_user, get_user_by_google_id
from plant_api.schema import DeAnonUser, User

router = BaseRouter(
    prefix="/users",
    dependencies=[Depends(get_current_user_session)],
    responses={404: {"description": "Not found"}},
)


@router.get("/", response_model=list[DeAnonUser])
async def get_users():
    # TODO: add get number of images for user and add to user return
    users = get_all_active_users()
    for user in users:
        total_plants, active_plants = get_n_plants_for_user(user)
        user.n_total_plants = total_plants
        user.n_active_plants = active_plants
    return [DeAnonUser(**user.model_dump()) for user in users]


def is_user_access_allowed(requesting_user: User, target_user_id: str) -> bool:
    """Check if the requesting_user is allowed to access the target_user's data.

    This currently just checks if the requesting_user is the same as the target_user
    If not, then it checks if the target user is a public user.
    If not, then it returns False.

    In the future, this could have a friends list check.
    """
    if requesting_user.google_id == target_user_id:
        return True
    target_user = get_user_by_google_id(target_user_id)
    if target_user.is_public_profile:
        return True
    return False
