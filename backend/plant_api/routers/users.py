from typing import Annotated

from pydantic import BaseModel
from plant_api.routers.common import BaseRouter

from plant_api.dependencies import get_current_user_session
from fastapi import Depends, HTTPException

from plant_api.utils.db import get_all_active_users, get_db_table, get_n_plants_for_user
from plant_api.schema import DeAnonUser, User, UserItem

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


@router.get("/me", response_model=User)
async def get_me(user: Annotated[User, Depends(get_current_user_session)]):
    return user


class VisibilitySettings(BaseModel):
    is_public: bool


@router.post("/settings/visibility")
async def set_visibility(settings: VisibilitySettings, user: Annotated[User, Depends(get_current_user_session)]):
    table = get_db_table()
    pk = f"USER#{user.google_id}"
    sk = f"USER#{user.google_id}"

    # Retrieve the existing plant
    response = table.get_item(Key={"PK": pk, "SK": sk})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="User not found")
    item = UserItem(**response["Item"])
    item.is_public_profile = settings.is_public

    table.put_item(Item=item.dynamodb_dump())
    return {"visibility": settings.is_public}
