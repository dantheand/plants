import os

import pytest

from backend.plant_api.utils.aws import get_aws_secret


class TestAWSAccess:
    @pytest.mark.skipif(os.environ.get("GITHUB_ENV") is not None, reason="This test doesn't work in GitHub builds.")
    def test_get_aws_secret(self):
        result = get_aws_secret("test_secret")
        assert result == "test_value"
