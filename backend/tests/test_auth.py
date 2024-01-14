from datetime import datetime, timedelta

import pytest

from jose import jwt


from plant_api import dependencies
from plant_api.routers import auth
from plant_api.schema import EntityType, ItemKeys, TokenItem
from plant_api.routers.auth import REFRESH_TOKEN, get_token_item_by_token
from tests.lib import DEFAULT_TEST_USER, TEST_JWT_SECRET
from plant_api.constants import ALGORITHM, GoogleOauthPayload, JWT_KEY_IN_SECRETS_MANAGER, get_jwt_secret
from plant_api.utils.secrets import get_aws_secret


@pytest.fixture
def mock_find_user(monkeypatch):
    def mock_find_user_by_google_id(google_id):
        return DEFAULT_TEST_USER

    monkeypatch.setattr(auth, "find_user_by_google_id", mock_find_user_by_google_id)


@pytest.fixture
def mock_allowed_user_db(monkeypatch):
    def mock_allowed_user_db(email):
        return True

    monkeypatch.setattr(dependencies, "valid_email_from_db", mock_allowed_user_db)


def create_current_access_token() -> str:
    payload = GoogleOauthPayload(email=DEFAULT_TEST_USER.email, sub=DEFAULT_TEST_USER.google_id)
    current_access_token, _ = auth.create_access_token_for_user(payload)
    return current_access_token


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


def create_expired_refresh_token(mock_db) -> TokenItem:
    payload = GoogleOauthPayload(email=DEFAULT_TEST_USER.email, sub=DEFAULT_TEST_USER.google_id)
    current_refresh_token, exp = auth.create_token_for_user(payload, expires_delta=timedelta(days=-1))

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
    def test_get_tokens_on_login(self, client_logged_in, mock_google_oauth, mock_find_user, mock_db):
        mock_oauth2_token = "mock_oauth2_token"
        mock_nonce = "mock_nonce"

        response = client_logged_in().post(
            "/token",
            json={"token": mock_oauth2_token, "nonce": mock_nonce},
        )
        assert response.status_code == 200
        access_token = response.json()
        decoded_access_token = jwt.decode(access_token, get_jwt_secret(), algorithms=[ALGORITHM])
        decoded_refresh_token = jwt.decode(response.cookies["refresh_token"], get_jwt_secret(), algorithms=[ALGORITHM])

        assert decoded_access_token["google_id"] == DEFAULT_TEST_USER.google_id
        assert decoded_refresh_token["google_id"] == DEFAULT_TEST_USER.google_id

    def test_get_new_tokens_from_refresh_token(self, client_logged_in, mock_find_user, mock_db):
        # Create refresh token in DB
        current_refresh_token = create_current_refresh_token(mock_db)
        print(current_refresh_token)

        response = client_logged_in().post("/refresh_token", cookies={REFRESH_TOKEN: current_refresh_token.token_str})
        assert response.status_code == 200
        # Assert that the old one is revoked
        old_token_in_db = get_token_item_by_token(current_refresh_token.token_str)
        print(old_token_in_db)
        assert old_token_in_db.revoked is True

        # Assert that we get a new one and that it's in the DB
        access_token = response.json()
        decoded_access_token = jwt.decode(access_token, get_jwt_secret(), algorithms=[ALGORITHM])
        decoded_refresh_token = jwt.decode(response.cookies[REFRESH_TOKEN], get_jwt_secret(), algorithms=[ALGORITHM])

        assert decoded_access_token["google_id"] == DEFAULT_TEST_USER.google_id
        assert decoded_refresh_token["google_id"] == DEFAULT_TEST_USER.google_id

    def test_get_access_token_from_expired_refresh_token(self, client_logged_in, mock_find_user, mock_db):
        expired_refresh_token = create_expired_refresh_token(mock_db)
        response = client_logged_in().post("/refresh_token", cookies={REFRESH_TOKEN: expired_refresh_token.token_str})

        assert response.status_code == 401

    def test_check_token(self, client_no_jwt, mock_db):
        response = client_no_jwt().get("/check_token")
        assert response.status_code == 401

    def test_check_token_with_valid_token(self, client_no_jwt, mock_allowed_user_db):
        jwt_access_token = create_current_access_token()
        response = client_no_jwt().get("/check_token", headers={"Authorization": f"Bearer {jwt_access_token}"})
        assert response.status_code == 200

    # TODO: implement this to prevent refresh token replay attacks
    def test_refresh_token_reuse_invalidates_all_users_tokens(self):
        pass
