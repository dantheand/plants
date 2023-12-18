import uuid
from datetime import date
from typing import Optional

import boto3
import pytest
from faker import Faker
from moto import mock_dynamodb
from starlette.testclient import TestClient

from api.constants import NEW_PLANTS_TABLE
from api.dependencies import get_current_user
from api.main import app
from api.utils.schema import DbModelType, EntityType, PlantItem, User


class MockDB:
    def __init__(self):
        self.table_name = NEW_PLANTS_TABLE
        self.dynamodb = boto3.resource("dynamodb", region_name="us-west-2")

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
            ProvisionedThroughput={"ReadCapacityUnits": 1, "WriteCapacityUnits": 1},
        )

    def insert_mock_data(self, db_item: DbModelType):
        self.dynamodb.Table(self.table_name).put_item(Item=db_item.model_dump())

    def delete_table(self):
        table = self.dynamodb.Table(self.table_name)
        table.delete()


@pytest.fixture(scope="function")
def mock_db():
    with mock_dynamodb():
        mock_db = MockDB()
        mock_db.create_table()

        yield mock_db

        mock_db.delete_table()


@pytest.fixture(scope="function")
def client():
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
DEFAULT_TEST_USER = User(email="test@testing.com", disabled=False)
OTHER_TEST_USER = User(email="other@testing.com", disabled=False)


def create_plant_item(
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
        sink=sink or fake.word(),
        sink_date=sink_date or fake.date(),
        notes=notes or fake.text(),
        PK=f"USER#{user_id or DEFAULT_TEST_USER.email}",
        SK=f"PLANT#{plant_id or fake.uuid4()}",
        entity_type=EntityType.PLANT,
    )
