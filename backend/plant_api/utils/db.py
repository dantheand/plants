from typing import List, Optional, Tuple
from uuid import UUID

import boto3
from boto3.dynamodb.conditions import Attr, Key
from fastapi import HTTPException

from plant_api.constants import AWS_REGION, TABLE_NAME
from plant_api.schema import ImageItem, PlantItem, User
from plant_api.schema import ItemKeys, UserItem

from pydantic import TypeAdapter


def get_db_connection():
    return boto3.resource("dynamodb", region_name=AWS_REGION)


def get_db_table():
    return get_db_connection().Table(TABLE_NAME)


def query_by_plant_id(table, plant_id: UUID) -> PlantItem:
    """Uses secondary index to query for a plant by its plant_id since plant IDs are in the SK field"""
    idx_pk_value = f"PLANT#{plant_id}"
    response = table.query(IndexName="SK-PK-index", KeyConditionExpression=Key("SK").eq(idx_pk_value))
    if not response["Items"]:
        raise HTTPException(status_code=404, detail=f"Could not find plant with ID {plant_id}.")
    return PlantItem(**response["Items"][0])


def query_by_image_id(table, image_id: UUID) -> ImageItem:
    """Uses secondary index to query for a plant by its plant_id since plant IDs are in the SK field"""
    idx_pk_value = f"IMAGE#{image_id}"
    response = table.query(IndexName="SK-PK-index", KeyConditionExpression=Key("SK").eq(idx_pk_value))
    if not response["Items"]:
        raise HTTPException(status_code=404, detail=f"Could not find image with ID {image_id}.")
    return ImageItem(**response["Items"][0])


def make_image_query_key(plant_id: UUID, image_id: UUID) -> dict:
    return {"PK": f"PLANT#{plant_id}", "SK": f"IMAGE#{image_id}"}


def get_items_with_pk_and_sk_starting_with(table, prefix):
    # Scan with filter expression for both PK and SK
    response = table.scan(FilterExpression=Attr("PK").begins_with(prefix) & Attr("SK").begins_with(prefix))

    return response["Items"]


def get_all_users() -> List[User]:
    """Queries DB for all entries where both PK and SK begin with USER#"""
    table = get_db_table()  # Assuming get_db_table() returns the DynamoDB table object
    response = get_items_with_pk_and_sk_starting_with(table, ItemKeys.USER)
    user_items = [UserItem(**item) for item in response]
    users = [User(**user_item.model_dump()) for user_item in user_items]

    return users


def get_all_active_users() -> List[User]:
    all_users = get_all_users()
    return [user for user in all_users if not user.disabled]


def get_user_by_google_id(google_id: Optional[str]) -> Optional[UserItem]:
    """Returns the user with the given google_id"""
    if not google_id:
        return None
    pk_sk_val = f"{ItemKeys.USER}#{google_id}"
    response = get_db_table().query(KeyConditionExpression=Key("PK").eq(pk_sk_val) & Key("SK").eq(pk_sk_val))
    if not response["Items"]:
        return None
    if len(response["Items"]) > 1:
        # make a more specific exception
        raise ValueError(f"More than one user found with google_id {google_id}")
    return UserItem(**response["Items"][0])


def get_n_plants_for_user(user: User) -> Tuple[int, int]:
    """Returns the number of plants for the given user"""
    pk_sk_val = f"{ItemKeys.USER}#{user.google_id}"
    response = get_db_table().query(
        KeyConditionExpression=Key("PK").eq(pk_sk_val) & Key("SK").begins_with(ItemKeys.PLANT)
    )
    parsed_plants = TypeAdapter(list[PlantItem]).validate_python(response["Items"])
    total_plants = len(parsed_plants)
    unsunk_plants = len([plant for plant in parsed_plants if not plant.sink])
    return total_plants, unsunk_plants
