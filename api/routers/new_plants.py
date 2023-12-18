from uuid import UUID

from boto3.dynamodb.conditions import Key
from fastapi import APIRouter, Depends, HTTPException

from api.dependencies import get_current_user
from api.utils.db import get_db_table
from api.utils.schema import PlantItem

router = APIRouter(
    prefix="/new_plants",
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
async def get_plant_for_user(plant_id: UUID, user_id: str):
    pk_value = f"USER#{user_id}"
    sk_value = f"PLANT#{plant_id}"
    table = get_db_table()

    response = table.query(KeyConditionExpression=Key("PK").eq(pk_value) & Key("SK").eq(sk_value))
    items = response.get("Items", [])
    if items:
        return items[0]
    else:
        raise HTTPException(status_code=404, detail="Plant not found")


@router.post("/")
async def create_plant(user=Depends(get_current_user)):
    ...


@router.put("/{plant_id}")
async def update_plant(plant_id: UUID, user=Depends(get_current_user)):
    ...


@router.delete("/{plant_id}")
async def delete_plant(plant_id: UUID, user=Depends(get_current_user)):
    ...
