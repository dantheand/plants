import csv
import io
from datetime import datetime
from typing import Any, Optional
from uuid import UUID

import requests
from boto3.dynamodb.conditions import Key
from dotenv import load_dotenv
import os
import boto3
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload
from pydantic import BaseModel, TypeAdapter

from backend.plant_api.constants import IMAGES_TABLE_NAME, PLANTS_TABLE_NAME, S3_BUCKET_NAME
from backend.plant_api.utils.db import get_db_table
from backend.plant_api.utils.schema import PlantCreate, PlantItem

BASE_URL = "http://localhost:8000"

load_dotenv()

# Pull in secrets
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
google_client_id = os.getenv("GOOGLE_CLIENT_ID")
google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
google_project_id = os.getenv("GOOGLE_PROJECT_ID")
google_id = os.getenv("GOOGLE_ID")


def get_db_connection():
    dynamodb = boto3.resource(
        "dynamodb",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        region_name="us-west-2",
    )
    return dynamodb


def get_s3_connection():
    s3 = boto3.client(
        "s3",
        aws_access_key_id=aws_access_key_id,
        aws_secret_access_key=aws_secret_access_key,
        region_name="us-west-2",
    )
    return s3


def get_gdrive_connection():
    # Google API client configuration
    client_config = {
        "installed": {
            "client_id": google_client_id,
            "project_id": google_project_id,
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": google_client_secret,
            "redirect_uris": ["urn:ietf:wg:oauth:2.0:oob", "http://localhost"],
        }
    }

    # Authenticate and create the service
    flow = InstalledAppFlow.from_client_config(client_config, ["https://www.googleapis.com/auth/drive.readonly"])
    creds = flow.run_local_server(port=8080)
    service = build("drive", "v3", credentials=creds)
    return service


def old_upload_plants():
    dynamodb = get_db_connection()
    table = dynamodb.Table(PLANTS_TABLE_NAME)
    with open("../data/plants_sheet.csv", "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Format the CSV row to DynamoDB item structure
            item = format_plant_row(row)

            # Insert the item into DynamoDB
            table.put_item(Item=item)

    print("Plants uploaded to DynamoDB successfully!")


def upload_images():
    dynamodb = get_db_connection()
    table = dynamodb.Table(IMAGES_TABLE_NAME)
    with open("../data/photos_sheet.csv", "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row_num, row in enumerate(reader):
            # Format the CSV row to DynamoDB item structure
            if row["Photo"] == "":
                continue
            item = format_image_row(row, row_num)

            # Insert the item into DynamoDB
            table.put_item(Item=item)

    print("Plant images uploaded to DynamoDB successfully!")


def download_file_from_drive(service, file_id):
    request = service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)

    done = False
    while not done:
        status, done = downloader.next_chunk()
        print("Download Progress: {0}%".format(int(status.progress() * 100)))

    fh.seek(0)  # Reset stream position
    return fh


def transfer_images_from_gdrive_to_s3():
    """Iterate through each image entry in the database, download the image from gdrive, upload it to s3,
    and update the database entry with the s3 url
    """
    dynamodb = get_db_connection()
    table = dynamodb.Table(IMAGES_TABLE_NAME)

    s3 = get_s3_connection()

    # Get the google drive connection
    gdrive = get_gdrive_connection()

    # Get all the image links from the database
    response = table.scan()
    items = response["Items"]

    # Iterate through each image
    for item in items:
        # Get the image id and gdrive url
        image_id = item["ImageID"]
        gdrive_url = item["GDriveUrl"].split("id=")[1]

        # Download the image from gdrive
        fh = download_file_from_drive(gdrive, gdrive_url)
        # Upload the image to s3
        s3_key = f"images/{image_id}.jpg"
        s3.upload_fileobj(fh, S3_BUCKET_NAME, s3_key)
        s3_url = f"https://{S3_BUCKET_NAME}.s3-us-west-2.amazonaws.com/{s3_key}"

        # Update the database entry with the s3 url
        table.update_item(
            Key={"ImageID": image_id},
            UpdateExpression="set S3Url=:s",
            ExpressionAttributeValues={":s": s3_url},
        )


def query_table(table_name):
    dynamodb = get_db_connection()
    table = dynamodb.Table(table_name)

    response = table.scan()

    items = response["Items"]
    for item in items:
        print(item)


# Function to format CSV row to DynamoDB item
def format_plant_row(row):
    # Format the row data here. This depends on your table's schema.
    return {
        "PlantID": row["id"],
        "HumanName": row["human_name"],
        "Location": row["location"],
        "Species": row["species"],
        "ParentID": row["parent_id"],
        "Source": row["source"],
        "SourceDate": row["source_date"],
        "Sink": row["sink"],
        "SinkDate": row["sink_date"],
        "Notes": row["Notes"],
    }


def format_image_row(row, row_num):
    # Format the row data here. This depends on your table's schema.
    return {
        "ImageID": str(row_num),
        "PlantID": row["plant_id"],
        "Timestamp": row["Timestamp"],
        "GDriveUrl": row["Photo"],
    }


######################## NEW STUFF BELOW HERE ########################


def convert_date_str_to_iso(date_str: Optional[str]):
    if date_str is None:
        return None
    date_obj = datetime.strptime(date_str, "%m/%d/%Y")
    # Formatting to ISO 8601 date format (YYYY-MM-DD)
    iso_date_str = date_obj.strftime("%Y-%m-%d")
    return iso_date_str


######### Uploading plants


def format_new_plant_row(row):
    # Convert empty strings to None
    for key in row:
        if row[key] == "":
            row[key] = None

    # Convert parent id to list of int
    if row["parent_id"] is not None:
        row["parent_id"] = [int(parent_id) for parent_id in row["parent_id"].split(",")]

    return PlantCreate(
        human_id=row["id"],
        human_name=row["human_name"],
        location=row["location"],
        species=row["species"],
        parent_id=row["parent_id"],
        source=row["source"],
        source_date=convert_date_str_to_iso(row["source_date"]),
        sink=row["sink"],
        sink_date=convert_date_str_to_iso(row["sink_date"]),
        notes=row["Notes"],
    )


def create_new_plant(plant_item: PlantCreate):

    post_url = f"{BASE_URL}/new_plants/"

    return requests.post(post_url, json=plant_item.model_dump(), headers=get_jwt_token_header())


def upload_plants_from_csv():
    """Load in plant data, format it to proper schema, and use our app to POST to database"""
    with open("../data/plants_sheet.csv", "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for row in reader:
            # Format the CSV row to DynamoDB item structure
            item = format_new_plant_row(row)

            print(create_new_plant(item).json())


def get_jwt_token_header(set_content_type=True) -> dict[str, Any]:
    # You'll need to get this from the app manually, check your localStorage once you've logged in
    load_dotenv()
    jwt_token = os.getenv("TEMP_JWT_TOKEN")
    headers = {"Authorization": f"Bearer {jwt_token}"}
    if set_content_type:
        headers["Content-Type"] = "application/json"
    return headers


######## Uploading images


class ImageCreate(BaseModel):
    human_id: int
    plant_id: UUID
    timestamp: datetime
    gdrive_url: str


def format_new_image_row(row, all_plants: list[PlantItem]) -> Optional[ImageCreate]:
    # if row is empty return None
    if row["Timestamp"] == "":
        return None

    # Convert timestamp to correct format
    input_format = "%m/%d/%Y %H:%M:%S"
    parsed_datetime = datetime.strptime(row["Timestamp"], input_format)
    # output_format = "%Y-%m-%dT%H:%M:%S.%f"
    # output_datetime_str = parsed_datetime.strftime(output_format)

    # Get plant_id for human_id
    plant_id = get_plant_id_for_human_id(row["plant_id"], all_plants)

    return ImageCreate(
        human_id=row["plant_id"],
        plant_id=plant_id,
        timestamp=parsed_datetime,
        gdrive_url=row["Photo:::"].split("id=")[1],
    )


def get_plant_id_for_human_id(human_id: int, all_plants: list[PlantItem]) -> Optional[UUID]:
    for plant in all_plants:
        if plant.human_id == int(human_id):
            return plant.plant_id
    return None


def create_new_image(gdrive_service, image_item: ImageCreate):
    headers = get_jwt_token_header(set_content_type=False)

    # Get the full image from gdrive
    image_file = download_file_from_drive(gdrive_service, image_item.gdrive_url)

    post_url = f"{BASE_URL}/new_images/plants/{image_item.plant_id}"
    return requests.post(
        post_url,
        headers=headers,
        data={
            "timestamp": image_item.timestamp,
        },
        files={"image_file": ("filename", image_file, "image/png")},
    )


def upload_images_from_csv():
    """Load in image data, format it to proper schema, and use our app to POST to database"""

    gdrive_service = get_gdrive_connection()

    # First get all plants since we need to know the human_id -> plant_id mapping
    pk_value = f"USER#{google_id}"
    sk_value = f"PLANT#"
    table = get_db_table()

    response = table.query(KeyConditionExpression=Key("PK").eq(pk_value) & Key("SK").begins_with(sk_value))
    all_plants = TypeAdapter(list[PlantItem]).validate_python(response.get("Items", []))

    with open("../data/photos_sheet.csv", "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)
        for i, row in enumerate(reader):
            # if i == 1:
            #     break
            item = format_new_image_row(row, all_plants)

            if item is None:
                continue

            print(create_new_image(gdrive_service, item).json())


def main():
    upload_images_from_csv()
    pass


if __name__ == "__main__":
    main()
