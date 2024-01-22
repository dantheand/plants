import uuid
from datetime import datetime, timedelta
from fastapi.exceptions import HTTPException

import pytest
from jose import jwt

from plant_api.dependencies import get_current_user_session, get_session_token
from plant_api.routers.auth import create_access_token_for_user, create_refresh_token_for_user, create_token_for_user
from plant_api.schema import EntityType, ItemKeys, SessionTokenItem, TokenItem
from plant_api.routers.auth import get_token_item_by_token
from tests.lib import DEFAULT_TEST_USER, TEST_JWT_SECRET
from plant_api.constants import (
    ALGORITHM,
    GoogleOauthPayload,
    JWT_KEY_IN_SECRETS_MANAGER,
    get_jwt_secret,
    CREDENTIALS_EXCEPTION,
    SESSION_TOKEN_KEY,
)
from plant_api.utils.secrets import get_aws_secret


def create_current_access_token() -> str:
    payload = GoogleOauthPayload(email=DEFAULT_TEST_USER.email, sub=DEFAULT_TEST_USER.google_id)
    current_access_token, _ = create_access_token_for_user(payload)
    return current_access_token


def create_current_refresh_token(mock_db) -> TokenItem:
    payload = GoogleOauthPayload(email=DEFAULT_TEST_USER.email, sub=DEFAULT_TEST_USER.google_id)
    current_refresh_token, exp = create_refresh_token_for_user(payload)

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
    current_refresh_token, exp = create_token_for_user(payload, expires_delta=timedelta(days=-1))

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
    def test_get_jwt_and_session_on_login(
        self, client_no_session, mock_google_oauth, default_enabled_user_in_db, mock_db
    ):
        mock_oauth2_token = "mock_oauth2_token"
        mock_nonce = "mock_nonce"

        response = client_no_session().post(
            "/token",
            json={"token": mock_oauth2_token, "nonce": mock_nonce},
        )
        assert response.status_code == 200
        access_token = response.json()
        decoded_access_token = jwt.decode(access_token, get_jwt_secret(), algorithms=[ALGORITHM])
        session_token_item = get_session_token(response.cookies[SESSION_TOKEN_KEY])

        assert decoded_access_token["google_id"] == DEFAULT_TEST_USER.google_id
        assert session_token_item.user_id == DEFAULT_TEST_USER.google_id

    # TODO: probably move all the get_current_user_session tests here and run them through check_token
    def test_check_token_w_valid_token(self):
        pass

    def test_check_token_w_expired_token(self):
        pass

    def test_logout_revokes_session_token(self, client, mock_db):
        pass


# TODO: factor out the token creation into a function
class TestAuthDependencies:
    def test_get_current_user_w_valid_session(self, mock_db, default_enabled_user_in_db):
        # Create a valid session token
        current_session_token = SessionTokenItem(
            PK=f"{ItemKeys.SESSION_TOKEN}#{uuid.uuid4()}",
            SK=f"{ItemKeys.USER}#{default_enabled_user_in_db.google_id}",
            entity_type=EntityType.SESSION_TOKEN,
            issued_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=1),
            revoked=False,
        )
        mock_db.insert_mock_data(current_session_token)

        session_user = get_current_user_session(current_session_token.token_id)
        assert session_user.google_id == default_enabled_user_in_db.google_id

    def test_get_current_user_w_expired_session(self, mock_db, default_enabled_user_in_db):
        current_session_token = SessionTokenItem(
            PK=f"{ItemKeys.SESSION_TOKEN}#{uuid.uuid4()}",
            SK=f"{ItemKeys.USER}#{default_enabled_user_in_db.google_id}",
            entity_type=EntityType.SESSION_TOKEN,
            issued_at=datetime.utcnow() - timedelta(days=2),
            expires_at=datetime.utcnow() - timedelta(days=1),
            revoked=False,
        )
        mock_db.insert_mock_data(current_session_token)

        with pytest.raises(HTTPException):
            get_current_user_session(current_session_token.token_id)

    def test_get_current_user_w_revoked_session(self, mock_db, default_enabled_user_in_db):
        current_session_token = SessionTokenItem(
            PK=f"{ItemKeys.SESSION_TOKEN}#{uuid.uuid4()}",
            SK=f"{ItemKeys.USER}#{default_enabled_user_in_db.google_id}",
            entity_type=EntityType.SESSION_TOKEN,
            issued_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=1),
            revoked=True,
        )
        mock_db.insert_mock_data(current_session_token)

        with pytest.raises(HTTPException):
            get_current_user_session(current_session_token.token_id)

    def test_get_current_user_w_no_session(self, default_enabled_user_in_db):
        with pytest.raises(HTTPException):
            get_current_user_session("")

    def test_get_current_user_w_invalid_user(self, mock_db):
        current_session_token = SessionTokenItem(
            PK=f"{ItemKeys.SESSION_TOKEN}#{uuid.uuid4()}",
            SK=f"{ItemKeys.USER}#{'invalid_user_id'}",
            entity_type=EntityType.SESSION_TOKEN,
            issued_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=1),
            revoked=False,
        )
        mock_db.insert_mock_data(current_session_token)

        with pytest.raises(HTTPException):
            get_current_user_session(current_session_token.token_id)

    def test_get_current_user_w_disabled_user(self, default_disabled_user_in_db):
        current_session_token = SessionTokenItem(
            PK=f"{ItemKeys.SESSION_TOKEN}#{uuid.uuid4()}",
            SK=f"{ItemKeys.USER}#{default_disabled_user_in_db.google_id}",
            entity_type=EntityType.SESSION_TOKEN,
            issued_at=datetime.utcnow(),
            expires_at=datetime.utcnow() + timedelta(days=1),
            revoked=False,
        )

        with pytest.raises(HTTPException):
            get_current_user_session(current_session_token.token_id)
