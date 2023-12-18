import os
from unittest import mock

import boto3
import pytest
from moto import mock_secretsmanager

from backend.plant_api.constants import JWT_KEY_IN_SECRETS_MANAGER


@pytest.fixture(autouse=True, scope="session")
def mock_jwt_secret():

    with mock_secretsmanager():
        boto3.client("secretsmanager", region_name="us-west-2").create_secret(
            Name=JWT_KEY_IN_SECRETS_MANAGER, SecretString="test_secret"
        )
        yield
