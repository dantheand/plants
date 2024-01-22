import os

import boto3
import pytest
from google.oauth2 import id_token
from moto import mock_dynamodb, mock_s3, mock_secretsmanager
from starlette.testclient import TestClient

from plant_api.constants import S3_BUCKET_NAME, TABLE_NAME
from plant_api.dependencies import get_current_user_session
from tests.lib import DEFAULT_TEST_USER, OTHER_TEST_USER, TEST_JWT_SECRET
from plant_api.constants import JWT_KEY_IN_SECRETS_MANAGER, AWS_REGION
from plant_api.schema import DbModelType, User, UserItem
from tests.lib import image_in_s3_factory, image_record_factory, plant_record_factory


# These fixtures are ran before any tests are run


@pytest.fixture(autouse=True, scope="session")
def mock_jwt_secret():

    with mock_secretsmanager():
        boto3.client("secretsmanager", region_name=AWS_REGION).create_secret(
            Name=JWT_KEY_IN_SECRETS_MANAGER, SecretString=TEST_JWT_SECRET
        )
        yield


@pytest.fixture(autouse=True, scope="session")
def set_mock_aws_env_vars():
    if "AWS_PROFILE" in os.environ:
        del os.environ["AWS_PROFILE"]
    os.environ["AWS_ACCESS_KEY_ID"] = "testing"
    os.environ["AWS_SECRET_ACCESS_KEY"] = "testing"
    os.environ["AWS_SECURITY_TOKEN"] = "testing"
    os.environ["AWS_SESSION_TOKEN"] = "testing"
    os.environ["AWS_DEFAULT_REGION"] = AWS_REGION


@pytest.fixture
def default_user_plant(mock_db):
    plant = plant_record_factory()
    mock_db.insert_mock_data(plant)
    return plant


def create_plants_for_user(mock_db, user: User, n_plants: int):
    plants = [plant_record_factory(user_id=user.google_id) for _ in range(n_plants)]
    for plant in plants:
        mock_db.insert_mock_data(plant)
    return plants


def create_and_insert_image_record(mock_db, plant_id=None):
    image = image_record_factory(plant_id=plant_id)
    mock_db.insert_mock_data(image)
    return image


@pytest.fixture
def image_record(mock_db):
    return create_and_insert_image_record(mock_db)


@pytest.fixture
def plant_with_image_record(mock_db, default_user_plant):
    plant = default_user_plant
    image = create_and_insert_image_record(mock_db, plant_id=plant.plant_id)
    return plant, image


@pytest.fixture
def plant_with_image_in_s3(mock_db, fake_s3, plant_with_image_record):
    plant, image = plant_with_image_record
    image_in_s3_factory(image_id=image.image_id, plant_id=plant.plant_id)
    return plant, image


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
        self.dynamodb.Table(self.table_name).put_item(Item=db_item.dynamodb_dump())

    def delete_table(self):
        table = self.dynamodb.Table(self.table_name)
        table.delete()


@pytest.fixture
def fake_s3():
    with mock_s3():
        client = boto3.client("s3", region_name=AWS_REGION)
        client.create_bucket(Bucket=S3_BUCKET_NAME, CreateBucketConfiguration={"LocationConstraint": AWS_REGION})
        yield client


@pytest.fixture
def mock_db():
    with mock_dynamodb():
        mock_db = MockDB()
        mock_db.create_table()

        yield mock_db

        mock_db.delete_table()


@pytest.fixture
def client_mock_session():
    app = get_app()

    def _get_client(current_user: User = DEFAULT_TEST_USER):
        def mock_get_current_user():
            return current_user

        app.dependency_overrides[get_current_user_session] = mock_get_current_user
        test_client = TestClient(app)
        return test_client

    yield _get_client
    # Clear overrides after the test
    app.dependency_overrides.clear()


@pytest.fixture
def client_no_session():
    app = get_app()

    def _get_client():
        test_client = TestClient(app)
        return test_client

    yield _get_client


@pytest.fixture
def mock_google_oauth(monkeypatch):
    def mock_verify_oauth2_token(token, request, audience):
        # Return a mock response that imitates Google's response
        return {"sub": DEFAULT_TEST_USER.google_id, "email": DEFAULT_TEST_USER.email, "nonce": "mock_nonce"}

    monkeypatch.setattr(id_token, "verify_oauth2_token", mock_verify_oauth2_token)


@pytest.fixture
def default_enabled_user_in_db(mock_db):
    user = UserItem(
        PK=f"USER#{DEFAULT_TEST_USER.google_id}",
        SK=f"USER#{DEFAULT_TEST_USER.google_id}",
        email=DEFAULT_TEST_USER.email,
        disabled=False,
    )
    mock_db.insert_mock_data(user)
    return user


@pytest.fixture
def default_disabled_user_in_db(mock_db):
    user = UserItem(
        PK=f"USER#{DEFAULT_TEST_USER.google_id}",
        SK=f"USER#{DEFAULT_TEST_USER.google_id}",
        email=DEFAULT_TEST_USER.email,
        disabled=True,
    )
    mock_db.insert_mock_data(user)
    return user


@pytest.fixture
def other_enabled_user_in_db(mock_db):
    user = UserItem(
        PK=f"USER#{OTHER_TEST_USER.google_id}",
        SK=f"USER#{OTHER_TEST_USER.google_id}",
        email=DEFAULT_TEST_USER.email,
        disabled=False,
    )
    mock_db.insert_mock_data(user)
    return user
