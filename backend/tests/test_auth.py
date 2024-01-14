from datetime import datetime

import pytest

from jose import jwt

from google.oauth2 import id_token

from plant_api.routers import auth
from plant_api.schema import EntityType, ItemKeys, TokenItem
from plant_api.routers.auth import REFRESH_TOKEN, get_token_item_by_token
from tests.lib import DEFAULT_TEST_USER, TEST_JWT_SECRET
from plant_api.constants import ALGORITHM, GoogleOauthPayload, JWT_KEY_IN_SECRETS_MANAGER, get_jwt_secret
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


def create_current_refresh_token(mock_db) -> TokenItem:
    payload = GoogleOauthPayload(email=DEFAULT_TEST_USER.email, sub=DEFAULT_TEST_USER.google_id)
    current_refresh_token, exp = auth.create_refresh_token_for_user(payload)

    current_refresh_token_item = TokenItem(
        PK=f"{ItemKeys.REFRESH_TOKEN}#{current_refresh_token}",
        SK=f"USER#{DEFAULT_TEST_USER.google_id}",
        entity_type=EntityType.REFRESH_TOKEN,
        issued_at=datetime.utcnow(),
        expires_at=exp,
    )
    mock_db.insert_mock_data(current_refresh_token_item)
    return current_refresh_token_item


class TestAWSAccess:
    def test_get_jwt_key(self):
        secret = get_aws_secret(JWT_KEY_IN_SECRETS_MANAGER)
        assert secret == TEST_JWT_SECRET


class TestTokenFlow:
    def test_get_tokens_on_login(self, client, mock_google_oauth, mock_find_user, mock_db):
        mock_oauth2_token = "mock_oauth2_token"
        mock_nonce = "mock_nonce"

        response = client().post(
            "/token",
            json={"token": mock_oauth2_token, "nonce": mock_nonce},
        )
        assert response.status_code == 200
        access_token = response.json()
        decoded_access_token = jwt.decode(access_token, get_jwt_secret(), algorithms=[ALGORITHM])
        decoded_refresh_token = jwt.decode(response.cookies["refresh_token"], get_jwt_secret(), algorithms=[ALGORITHM])

        assert decoded_access_token["sub"] == DEFAULT_TEST_USER.google_id
        assert decoded_refresh_token["sub"] == DEFAULT_TEST_USER.google_id

    def test_get_new_tokens_from_refresh_token(self, client, mock_find_user, mock_db):
        # Create refresh token in DB
        current_refresh_token = create_current_refresh_token(mock_db)
        print(current_refresh_token)

        response = client().post("/refresh_token", cookies={REFRESH_TOKEN: current_refresh_token.token_str})
        assert response.status_code == 200
        # Assert that the old one is revoked
        old_token_in_db = get_token_item_by_token(current_refresh_token.token_str)
        print(old_token_in_db)
        assert old_token_in_db.revoked is True

        # Assert that we get a new one and that it's in the DB
        access_token = response.json()
        decoded_access_token = jwt.decode(access_token, get_jwt_secret(), algorithms=[ALGORITHM])
        decoded_refresh_token = jwt.decode(response.cookies[REFRESH_TOKEN], get_jwt_secret(), algorithms=[ALGORITHM])

        assert decoded_access_token["sub"] == DEFAULT_TEST_USER.google_id
        assert decoded_refresh_token["sub"] == DEFAULT_TEST_USER.google_id

    def test_get_access_token_from_expired_refresh_token(self):
        pass

    # TODO: implement this to prevent replay attacks
    def test_refresh_token_reuse_invalidates_all_users_tokens(self):
        pass
