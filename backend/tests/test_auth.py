import os

import pytest

from backend.plant_api.utils.aws import get_aws_secret


class TestAWSAccess:
    @pytest.mark.skipif(os.environ["AWS_"], reason="requires python3.3")
    def test_get_aws_secret(self):
        result = get_aws_secret("test_secret")
        assert result == "test_value"
