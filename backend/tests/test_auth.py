import os

import pytest

from backend.plant_api.constants import JWT_KEY_IN_SECRETS_MANAGER
from backend.plant_api.utils.aws import get_aws_secret


class TestAWSAccess:
    def test_get_jwt_key(self):
        secret = get_aws_secret(JWT_KEY_IN_SECRETS_MANAGER)
        assert secret == "test_secret"
