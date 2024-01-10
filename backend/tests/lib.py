import io
import uuid
from datetime import date, datetime
from typing import Optional

from botocore.exceptions import ClientError
import boto3
import pytest
from PIL import Image as img
from faker import Faker
from moto import mock_dynamodb, mock_s3
from starlette.testclient import TestClient
from PIL.Image import Image

from plant_api.dependencies import get_current_user
from plant_api.routers.new_images import ImageSuffixes, make_s3_path_for_image, upload_image_to_s3

# from plant_api.main import app
from plant_api.schema import DbModelType, EntityType, ImageItem, ItemKeys, PlantItem, User

from plant_api.constants import AWS_REGION, TABLE_NAME, S3_BUCKET_NAME


TEST_FIXTURE_DIR = "./tests/fixture_data/"


def get_app():
    from plant_api.main import app

    return app


class MockDB:
    def __init__(self):
        self.table_name = TABLE_NAME
        self.dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)

    def create_table(self):
        self.dynamodb.create_table(
            TableName=self.table_name,
            KeySchema=[
                {"AttributeName": "PK", "KeyType": "HASH"},
                {"AttributeName": "SK", "KeyType": "RANGE"},
            ],
            AttributeDefinitions=[
                {"AttributeName": "PK", "AttributeType": "S"},
                {"AttributeName": "SK", "AttributeType": "S"},
            ],
            GlobalSecondaryIndexes=[
                {
                    "IndexName": "SK-PK-index",
                    "KeySchema": [
                        {"AttributeName": "SK", "KeyType": "HASH"},
                        {"AttributeName": "PK", "KeyType": "HASH"},
                    ],
                    "Projection": {"ProjectionType": "ALL"},
                },
            ],
            ProvisionedThroughput={"ReadCapacityUnits": 1, "WriteCapacityUnits": 1},
        )

    def insert_mock_data(self, db_item: DbModelType):
        self.dynamodb.Table(self.table_name).put_item(Item=db_item.model_dump())

    def delete_table(self):
        table = self.dynamodb.Table(self.table_name)
        table.delete()


@pytest.fixture(scope="function")
def fake_s3():
    with mock_s3():
        client = boto3.client("s3", region_name=AWS_REGION)
        client.create_bucket(Bucket=S3_BUCKET_NAME, CreateBucketConfiguration={"LocationConstraint": AWS_REGION})
        yield client


@pytest.fixture(scope="function")
def mock_db():
    with mock_dynamodb():
        mock_db = MockDB()
        mock_db.create_table()

        yield mock_db

        mock_db.delete_table()


@pytest.fixture(scope="function")
def client():
    app = get_app()

    def _get_client(current_user: User = DEFAULT_TEST_USER):
        def mock_get_current_user():
            return current_user

        app.dependency_overrides[get_current_user] = mock_get_current_user
        test_client = TestClient(app)
        return test_client

    yield _get_client
    # Clear overrides after the test
    app.dependency_overrides.clear()


fake = Faker()
DEFAULT_TEST_USER = User(email="test@testing.com", google_id="123", disabled=False)
OTHER_TEST_USER = User(email="other@testing.com", google_id="321", disabled=False)


def plant_record_factory(
    human_name: Optional[str] = None,
    human_id: Optional[int] = None,
    species: Optional[str] = None,
    location: Optional[str] = None,
    sink: Optional[str] = None,
    sink_date: Optional[date] = None,
    notes: Optional[str] = None,
    user_id: Optional[str] = None,
    plant_id: Optional[uuid.UUID] = None,
) -> PlantItem:
    return PlantItem(
        human_name=human_name or fake.name(),
        human_id=human_id or fake.random_int(min=1, max=10000),
        species=species or fake.word(),
        location=location or fake.word(),
        source=fake.word(),
        source_date=fake.date(),
        sink=sink or fake.word(),
        sink_date=sink_date or fake.date(),
        notes=notes or fake.text(),
        PK=f"{ItemKeys.USER}#{user_id or DEFAULT_TEST_USER.google_id}",
        SK=f"{ItemKeys.PLANT}#{plant_id or fake.uuid4()}",
        entity_type=EntityType.PLANT,
    )


def image_record_factory(
    plant_id: Optional[uuid.UUID] = None,
    image_id: Optional[uuid.UUID] = None,
    full_photo_s3_url: Optional[str] = None,
    thumbnail_photo_s3_url: Optional[str] = None,
    timestamp: Optional[datetime] = None,
) -> ImageItem:
    if plant_id is None:
        plant_id = fake.uuid4()
    if image_id is None:
        image_id = fake.uuid4()
    return ImageItem(
        PK=f"{ItemKeys.PLANT}#{plant_id}",
        SK=f"{ItemKeys.IMAGE}#{image_id}",
        entity_type=EntityType.IMAGE,
        full_photo_s3_url=full_photo_s3_url or make_s3_path_for_image(image_id, plant_id, ImageSuffixes.ORIGINAL),
        thumbnail_photo_s3_url=(
            thumbnail_photo_s3_url or make_s3_path_for_image(image_id, plant_id, ImageSuffixes.THUMB)
        ),
        timestamp=timestamp or fake.date_time(),
    )


def create_test_image(size=(100, 100)):
    # Create a simple image for testing
    file = io.BytesIO()
    image = img.new("RGB", size, color="red")
    image.save(file, "PNG")
    file.name = "test.png"
    file.seek(0)
    return file


def image_in_s3_factory(
    image: Optional[Image] = None,
    image_id: Optional[uuid.UUID] = None,
    plant_id: Optional[uuid.UUID] = None,
):
    if image is None:
        image = img.open(io.BytesIO(create_test_image().read()))
    if image_id is None:
        image_id = fake.uuid4()
    if plant_id is None:
        plant_id = fake.uuid4()

    _ = upload_image_to_s3(image, image_id, plant_id, ImageSuffixes.ORIGINAL)
    _ = upload_image_to_s3(image, image_id, plant_id, ImageSuffixes.THUMB)


def check_object_exists_in_s3(s3_client, bucket_name: str, object_key: str) -> bool:
    """
    Check if an object exists in an S3 bucket.

    True if object exists, False otherwise
    """
    try:
        s3_client.head_object(Bucket=bucket_name, Key=object_key)
        return True
    except ClientError as e:
        # Check if the error was because the object does not exist
        error_code = e.response["Error"]["Code"]
        if error_code == "404":
            return False
        else:
            raise  # re-raise if it's a different error
