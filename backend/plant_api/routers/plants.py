import logging
import uuid
from typing import Annotated
from uuid import UUID

from boto3.dynamodb.conditions import Attr, Key
from fastapi import Depends, HTTPException, status

from plant_api.constants import ACCESS_NOT_ALLOWED_EXCEPTION
from plant_api.dependencies import get_current_user_session
from plant_api.routers.common import BaseRouter
from plant_api.utils.db import get_db_table, query_by_plant_id
from plant_api.schema import ImageItem, PlantCreate, PlantItem, PlantUpdate, User
from plant_api.routers.images import delete_image_from_s3

from pydantic import TypeAdapter

from plant_api.utils.db import is_user_access_allowed

LOGGER = logging.getLogger(__name__)

PLANT_ROUTE = "/plants"

router = BaseRouter(
    prefix=PLANT_ROUTE,
    dependencies=[Depends(get_current_user_session)],
    responses={404: {"description": "Not found"}},
)


def read_all_plants_for_user(user_id: str) -> list[PlantItem]:
    pk_value = f"USER#{user_id}"
    sk_value = "PLANT#"
    table = get_db_table()

    response = table.query(KeyConditionExpression=Key("PK").eq(pk_value) & Key("SK").begins_with(sk_value))
    return TypeAdapter(list[PlantItem]).validate_python(response["Items"])


@router.get("/user/{user_id}/{human_id}", response_model=PlantItem)
def get_plant_by_human_id(user_id: str, human_id: int, user: Annotated[User, Depends(get_current_user_session)]):
    if not is_user_access_allowed(user, user_id):
        raise ACCESS_NOT_ALLOWED_EXCEPTION
    all_user_plants = read_all_plants_for_user(user_id)
    for plant in all_user_plants:
        if plant.human_id == human_id:
            return plant


@router.get("/user/{user_id}", response_model=list[PlantItem])
async def all_plants(user_id: str, user: Annotated[User, Depends(get_current_user_session)]):
    if is_user_access_allowed(user, user_id):
        return read_all_plants_for_user(user_id)
    raise ACCESS_NOT_ALLOWED_EXCEPTION


@router.get("/{plant_id}", response_model=PlantItem)
def get_plant(plant_id: UUID, user: Annotated[User, Depends(get_current_user_session)]):
    table = get_db_table()
    response = query_by_plant_id(table, plant_id)
    if is_user_access_allowed(user, response.user_id):
        return response
    raise ACCESS_NOT_ALLOWED_EXCEPTION


@router.post("/create", response_model=PlantItem, status_code=status.HTTP_201_CREATED)
async def create_plant(plant_data: PlantCreate, user: Annotated[User, Depends(get_current_user_session)]):
    LOGGER.info(f"Creating plant for user {user.google_id}")
    table = get_db_table()
    # Query to check if a plant with the same human_id already exists for this user
    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"USER#{user.google_id}") & Key("SK").begins_with("PLANT#"),
        FilterExpression=Attr("human_id").eq(plant_data.human_id),
    )
    if response["Items"]:
        raise HTTPException(status_code=400, detail="Duplicate Unique Plant IDs for the same user not allowed")

    # Create a new plant item
    plant_id = str(uuid.uuid4())
    plant_item = PlantItem(
        PK=f"USER#{user.google_id}", SK=f"PLANT#{plant_id}", entity_type="Plant", **plant_data.model_dump()
    )

    table.put_item(Item=plant_item.dynamodb_dump())
    return plant_item


@router.patch("/{plant_id}", response_model=PlantItem)
async def update_plant(plant_id: UUID, new_data: PlantUpdate, user=Depends(get_current_user_session)):
    table = get_db_table()
    pk = f"USER#{user.google_id}"
    sk = f"PLANT#{str(plant_id)}"

    # Retrieve the existing plant
    response = table.get_item(Key={"PK": pk, "SK": sk})
    if "Item" not in response:
        raise HTTPException(status_code=404, detail="Plant not found")
    stored_item = PlantItem(**response["Item"])
    update_data = new_data.model_dump(exclude_unset=True)
    updated_item = stored_item.model_copy(update=update_data)

    table.put_item(Item=updated_item.dynamodb_dump())
    return updated_item


@router.delete("/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plant(plant_id: UUID, user=Depends(get_current_user_session)):
    table = get_db_table()
    pk = f"USER#{user.google_id}"
    sk = f"PLANT#{str(plant_id)}"

    # Check if the plant exists and belongs to the user
    response = table.get_item(Key={"PK": pk, "SK": sk})
    if "Item" not in response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")

    # Delete the plant item from DB
    table.delete_item(Key={"PK": pk, "SK": sk})

    # Delete all images associated with the plant from DB and S3
    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"PLANT#{plant_id}") & Key("SK").begins_with("IMAGE#"),
    )
    # Parse the response out as a list of ImageItems
    image_items = [ImageItem(**item) for item in response["Items"]]
    for image_item in image_items:
        table.delete_item(Key={"PK": image_item.PK, "SK": image_item.SK})
        # delete from S3
        delete_image_from_s3(image_item)

    return {"message": "Plant deleted successfully"}
