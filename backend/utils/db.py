import boto3
import os

from boto3.dynamodb.conditions import Key

from backend.utils.constants import IMAGES_TABLE_NAME, PLANTS_TABLE_NAME
from backend.utils.schema import Image, Plant


def _get_db_connection():
    # Check if running in AWS Lambda environment
    if "AWS_EXECUTION_ENV" in os.environ:
        # Running on AWS Lambda, use the execution role for credentials
        dynamodb = boto3.resource("dynamodb", region_name="us-west-2")
    else:
        # Running locally, load credentials from .env file
        from dotenv import load_dotenv

        load_dotenv()
        aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
        aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")

        dynamodb = boto3.resource(
            "dynamodb",
            aws_access_key_id=aws_access_key_id,
            aws_secret_access_key=aws_secret_access_key,
            region_name="us-west-2",
        )

    return dynamodb


def scan_table(table_name):
    session = _get_db_connection()
    table = session.Table(table_name)
    response = table.scan()
    # TODO: convert this to List[Plants] or validate in some way
    return response["Items"]


def get_plant_by_id(plant_id: str) -> Plant:
    session = _get_db_connection()
    table = session.Table(PLANTS_TABLE_NAME)
    response = table.get_item(Key={"PlantID": plant_id})
    return Plant(**response.get("Item"))


def get_images_for_plant(plant_id: str) -> list[Image]:
    session = _get_db_connection()
    table = session.Table(IMAGES_TABLE_NAME)
    # TODO: sort by timestamp
    response = table.scan(FilterExpression=Key("PlantID").eq(plant_id))
    return [Image.model_validate(image) for image in response["Items"]]
