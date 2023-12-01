import boto3
import os

from backend.utils.constants import PLANTS_TABLE_NAME
from backend.utils.schema import Plant


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
    return response["Items"]


def get_plant_by_id(plant_id: str):
    session = _get_db_connection()
    table = session.Table(PLANTS_TABLE_NAME)
    response = table.get_item(Key={"PlantID": plant_id})
    return Plant(**response.get("Item"))
