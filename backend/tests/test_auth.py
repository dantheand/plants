import os

import pytest

from backend.plant_api.constants import JWT_KEY_IN_SECRETS_MANAGER
from backend.plant_api.utils.aws import get_aws_secret


class TestAWSAccess:
    def test_get_aws_secret(self):
        result = get_aws_secret("test_secret")
        assert result == "test_value"
