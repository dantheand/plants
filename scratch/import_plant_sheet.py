import csv
import io

from dotenv import load_dotenv
import os
import boto3
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from backend.utils.constants import IMAGES_TABLE_NAME, PLANTS_TABLE_NAME, PLANT_IMAGES_BUCKET_NAME

load_dotenv()

# Pull in secrets
aws_access_key_id = os.getenv("AWS_ACCESS_KEY_ID")
aws_secret_access_key = os.getenv("AWS_SECRET_ACCESS_KEY")
google_client_id = os.getenv("GOOGLE_CLIENT_ID")
google_client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
google_project_id = os.getenv("GOOGLE_PROJECT_ID")


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


def upload_plants():
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
        s3.upload_fileobj(fh, PLANT_IMAGES_BUCKET_NAME, s3_key)
        s3_url = f"https://{PLANT_IMAGES_BUCKET_NAME}.s3-us-west-2.amazonaws.com/{s3_key}"

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


def main():
    gdrive = get_gdrive_connection()
    pass


if __name__ == "__main__":
    main()
