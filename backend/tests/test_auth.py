import pytest

from jose import jwt

from google.oauth2 import id_token

from plant_api.routers import auth
from tests.lib import DEFAULT_TEST_USER, TEST_JWT_SECRET
from plant_api.constants import ALGORITHM, JWT_KEY_IN_SECRETS_MANAGER, get_jwt_secret
from plant_api.utils.secrets import get_aws_secret


@pytest.fixture
def mock_google_oauth(monkeypatch):
    def mock_verify_oauth2_token(token, request, audience):
        # Return a mock response that imitates Google's response
        return {"sub": DEFAULT_TEST_USER.google_id, "email": DEFAULT_TEST_USER.email, "nonce": "mock_nonce"}

    monkeypatch.setattr(id_token, "verify_oauth2_token", mock_verify_oauth2_token)


@pytest.fixture
def mock_find_user(monkeypatch):
    def mock_find_user_by_google_id(google_id):
        return DEFAULT_TEST_USER

    monkeypatch.setattr(auth, "find_user_by_google_id", mock_find_user_by_google_id)


class TestAWSAccess:
    def test_get_jwt_key(self):
        secret = get_aws_secret(JWT_KEY_IN_SECRETS_MANAGER)
        assert secret == TEST_JWT_SECRET


class TestTokenFlow:
    def test_get_access_token(self, client, mock_google_oauth, mock_find_user, mock_db):
        mock_oauth2_token = "mock_oauth2_token"
        mock_nonce = "mock_nonce"

        response = client().post(
            "/token",
            json={"token": mock_oauth2_token, "nonce": mock_nonce},
        )
        access_token = response.json()
        decoded_access_token = jwt.decode(access_token, get_jwt_secret(), algorithms=[ALGORITHM])
        decoded_refresh_token = jwt.decode(response.cookies["refresh_token"], get_jwt_secret(), algorithms=[ALGORITHM])

        assert response.status_code == 200
        assert decoded_access_token["sub"] == DEFAULT_TEST_USER.google_id
        assert decoded_refresh_token["sub"] == DEFAULT_TEST_USER.google_id

    def test_get_refresh_token(self):
        pass

    def test_get_access_token_from_refresh_token(self):
        pass

    def test_get_access_token_from_expired_refresh_token(self):
        pass

    def test_get_access_token_from_invalid_refresh_token(self):
        pass
