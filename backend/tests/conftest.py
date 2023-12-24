import os

import boto3
import pytest
from moto import mock_secretsmanager

from backend.plant_api.constants import JWT_KEY_IN_SECRETS_MANAGER
from backend.tests.lib import AWS_REGION


# These fixtures are ran before any tests are run


@pytest.fixture(autouse=True, scope="session")
def mock_jwt_secret():

    with mock_secretsmanager():
        boto3.client("secretsmanager", region_name=AWS_REGION).create_secret(
            Name=JWT_KEY_IN_SECRETS_MANAGER, SecretString="test_secret"
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
