from uuid import UUID

import boto3
from boto3.dynamodb.conditions import Key
from fastapi import HTTPException

from backend.plant_api.constants import NEW_PLANTS_TABLE
from backend.plant_api.utils.schema import ImageItem, PlantItem


def get_db_connection():
    return boto3.resource("dynamodb", region_name="us-west-2")


def get_db_table():
    return get_db_connection().Table(NEW_PLANTS_TABLE)


def scan_table(table_name):
    session = get_db_connection()
    table = session.Table(table_name)
    response = table.scan()
    return response["Items"]


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
