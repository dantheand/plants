import uuid
from datetime import date, datetime
from typing import Optional
from unittest import mock

import boto3
import pytest
from faker import Faker
from moto import mock_dynamodb, mock_s3
from starlette.testclient import TestClient

from backend.plant_api.dependencies import get_current_user

# from backend.plant_api.main import app
from backend.plant_api.utils.schema import DbModelType, EntityType, ImageItem, PlantItem, User

from backend.plant_api.constants import AWS_REGION, NEW_PLANTS_TABLE, S3_BUCKET_NAME


def get_app():
    from backend.plant_api.main import app

    return app


class MockDB:
    def __init__(self):
        self.table_name = NEW_PLANTS_TABLE
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


def create_fake_plant(
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
        PK=f"USER#{user_id or DEFAULT_TEST_USER.google_id}",
        SK=f"PLANT#{plant_id or fake.uuid4()}",
        entity_type=EntityType.PLANT,
    )


def create_fake_image(
    s3_url: Optional[str] = None,
    signed_url: Optional[str] = None,
    timestamp: Optional[datetime] = None,
) -> ImageItem:
    return ImageItem(
        s3_url=s3_url or fake.url(),
        signed_url=signed_url,
        timestamp=timestamp or fake.date_time(),
        PK=f"PLANT#{fake.uuid4()}",
        SK=f"IMAGE#{fake.uuid4()}",
        entity_type=EntityType.IMAGE,
    )
