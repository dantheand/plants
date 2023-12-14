from api.routers.auth import get_aws_secret


class TestAWSAccess:
    def test_get_aws_secret(self):
        result = get_aws_secret("test_secret")
        assert result == "test_value"
