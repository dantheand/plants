import uuid
from typing import Annotated
from uuid import UUID

from boto3.dynamodb.conditions import Attr, Key
from fastapi import APIRouter, Depends, HTTPException, status

from backend.plant_api.dependencies import get_current_user
from backend.plant_api.utils.db import get_db_table
from backend.plant_api.utils.schema import PlantBase, PlantCreate, PlantItem, PlantUpdate, User

PLANT_ROUTE = "/new_plants"

router = APIRouter(
    prefix=PLANT_ROUTE,
    dependencies=[Depends(get_current_user)],
    responses={404: {"description": "Not found"}},
)


@router.get("/{user_id}", response_model=list[PlantItem])
async def read_all_plants_for_user(user_id=str):
    pk_value = f"USER#{user_id}"
    sk_value = f"PLANT#"
    table = get_db_table()

    response = table.query(KeyConditionExpression=Key("PK").eq(pk_value) & Key("SK").begins_with(sk_value))
    return response.get("Items", [])


@router.get("/{user_id}/{plant_id}", response_model=PlantItem)
def get_plant_for_user(plant_id: UUID, user_id: str):
    pk_value = f"USER#{user_id}"
    sk_value = f"PLANT#{plant_id}"
    table = get_db_table()

    response = table.query(KeyConditionExpression=Key("PK").eq(pk_value) & Key("SK").eq(sk_value))
    items = response.get("Items", [])
    if items:
        return items[0]
    else:
        raise HTTPException(status_code=404, detail="Plant not found")


@router.post("/", response_model=PlantItem, status_code=status.HTTP_201_CREATED)
async def create_plant(plant_data: PlantCreate, user: Annotated[User, Depends(get_current_user)]):
    table = get_db_table()
    # Query to check if a plant with the same human_id already exists for this user
    response = table.query(
        KeyConditionExpression=Key("PK").eq(f"USER#{user.google_id}") & Key("SK").begins_with("PLANT#"),
        FilterExpression=Attr("human_id").eq(plant_data.human_id),
    )
    if response["Items"]:
        raise HTTPException(status_code=400, detail="Duplicate plant IDs (human_id field) not allowed")

    # Create a new plant item
    plant_id = str(uuid.uuid4())
    plant_item = PlantItem(
        PK=f"USER#{user.google_id}", SK=f"PLANT#{plant_id}", entity_type="Plant", **plant_data.model_dump()
    )

    table.put_item(Item=plant_item.model_dump())
    return plant_item


@router.patch("/{plant_id}", response_model=PlantItem)
async def update_plant(plant_id: UUID, new_data: PlantUpdate, user=Depends(get_current_user)):
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

    table.put_item(Item=updated_item.model_dump())
    return updated_item


@router.delete("/{plant_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_plant(plant_id: UUID, user=Depends(get_current_user)):
    table = get_db_table()
    pk = f"USER#{user.google_id}"
    sk = f"PLANT#{str(plant_id)}"

    # Check if the plant exists and belongs to the user
    response = table.get_item(Key={"PK": pk, "SK": sk})
    if "Item" not in response:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plant not found")

    # Delete the plant item
    table.delete_item(Key={"PK": pk, "SK": sk})
    return {"message": "Plant deleted successfully"}
