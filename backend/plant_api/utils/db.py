from typing import List, Optional
from uuid import UUID

import boto3
from boto3.dynamodb.conditions import Key
from fastapi import HTTPException

from plant_api.constants import AWS_REGION, TABLE_NAME
from plant_api.schema import ImageItem, PlantItem, TokenItem, User, UserItem
from plant_api.schema import ItemKeys, UserItem


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


def query_tokens_by_user_id(table, user: User) -> list[TokenItem]:
    """Uses secondary index to query for a token by its user_id since user IDs are in the SK field"""
    idx_pk_value = f"USER#{user.google_id}"
    response = table.query(IndexName="SK-PK-index", KeyConditionExpression=Key("SK").eq(idx_pk_value))
    if not response["Items"]:
        raise HTTPException(status_code=404, detail=f"Could not find tokens for user with ID {user.google_id}.")
    return [TokenItem(**item) for item in response["Items"]]


def make_image_query_key(plant_id: UUID, image_id: UUID) -> dict:
    return {"PK": f"PLANT#{plant_id}", "SK": f"IMAGE#{image_id}"}


def get_items_with_pk_starting_with(table, pk_prefix):

    # Scan with filter expression
    response = table.scan(
        FilterExpression="begins_with(PK, :pk_prefix)", ExpressionAttributeValues={":pk_prefix": pk_prefix}
    )

    return response["Items"]


def get_all_users() -> List[UserItem]:
    """Queries DB for all PK that begin with USER"""
    response = get_items_with_pk_starting_with(get_db_table(), ItemKeys.USER)
    users = [UserItem(**item) for item in response]
    return users


def get_user_by_google_id(google_id: Optional[str]) -> Optional[UserItem]:
    """Returns the user with the given google_id"""
    if not google_id:
        return None
    response = get_db_table().query(KeyConditionExpression=Key("PK").eq(f"{ItemKeys.USER}#{google_id}"))
    if not response["Items"]:
        return None
    return UserItem(**response["Items"][0])
