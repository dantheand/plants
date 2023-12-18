import os

import boto3
import pytest
from moto import mock_secretsmanager

from backend.plant_api.constants import JWT_KEY_IN_SECRETS_MANAGER
from backend.plant_api.utils.aws import get_aws_secret


@pytest.fixture(autouse=True, scope="session")
def mock_aws_secrets():

    with mock_secretsmanager():
        boto3.client("secretsmanager", region_name="us-west-2").create_secret(
            Name=JWT_KEY_IN_SECRETS_MANAGER, SecretString="test_secret"
        )
        yield
