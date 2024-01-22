import uuid
from datetime import datetime, timedelta
from fastapi.exceptions import HTTPException

import pytest
from jose import jwt

from plant_api.dependencies import get_current_user_session, get_session_token
from plant_api.routers.auth import create_access_token_for_user
from plant_api.schema import EntityType, ItemKeys, SessionTokenItem
from tests.lib import DEFAULT_TEST_USER, TEST_JWT_SECRET
from plant_api.constants import (
    ALGORITHM,
    GoogleOauthPayload,
    JWT_KEY_IN_SECRETS_MANAGER,
    get_jwt_secret,
    SESSION_TOKEN_KEY,
)
from plant_api.utils.secrets import get_aws_secret


def create_current_access_token() -> str:
    payload = GoogleOauthPayload(email=DEFAULT_TEST_USER.email, sub=DEFAULT_TEST_USER.google_id)
    current_access_token, _ = create_access_token_for_user(payload)
    return current_access_token


def create_current_session_token(mock_db, user_id: str) -> SessionTokenItem:
    session_token = SessionTokenItem(
        PK=f"{ItemKeys.SESSION_TOKEN}#{uuid.uuid4()}",
        SK=f"{ItemKeys.USER}#{user_id}",
        entity_type=EntityType.SESSION_TOKEN,
        issued_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=1),
        revoked=False,
    )
    mock_db.insert_mock_data(session_token)
    return session_token


def create_revoked_session_token(mock_db, user_id: str) -> SessionTokenItem:
    session_token = SessionTokenItem(
        PK=f"{ItemKeys.SESSION_TOKEN}#{uuid.uuid4()}",
        SK=f"{ItemKeys.USER}#{user_id}",
        entity_type=EntityType.SESSION_TOKEN,
        issued_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=1),
        revoked=True,
    )
    mock_db.insert_mock_data(session_token)
    return session_token


def create_expired_session_token(mock_db, user_id: str) -> SessionTokenItem:
    session_token = SessionTokenItem(
        PK=f"{ItemKeys.SESSION_TOKEN}#{uuid.uuid4()}",
        SK=f"{ItemKeys.USER}#{user_id}",
        entity_type=EntityType.SESSION_TOKEN,
        issued_at=datetime.utcnow() - timedelta(days=2),
        expires_at=datetime.utcnow() - timedelta(days=1),
        revoked=False,
    )
    mock_db.insert_mock_data(session_token)
    return session_token


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

    def test_check_token_w_valid_token(self, client_no_session, mock_db, default_enabled_user_in_db):
        current_session_token = create_current_session_token(mock_db, default_enabled_user_in_db.google_id)

        response = client_no_session().get("/check_token", cookies={SESSION_TOKEN_KEY: current_session_token.token_id})
        assert response.status_code == 200
        assert response.json()["google_id"] == default_enabled_user_in_db.google_id

    def test_check_token_w_expired_token(self, client_no_session, mock_db, default_enabled_user_in_db):
        expired_session_token = create_expired_session_token(mock_db, default_enabled_user_in_db.google_id)

        response = client_no_session().get("/check_token", cookies={SESSION_TOKEN_KEY: expired_session_token.token_id})
        assert response.status_code == 401

    def test_logout_revokes_session_token(self, client_no_session, mock_db, default_enabled_user_in_db):
        current_session_token = create_current_session_token(mock_db, default_enabled_user_in_db.google_id)

        response = client_no_session().get("/logout", cookies={SESSION_TOKEN_KEY: current_session_token.token_id})
        assert response.status_code == 200

        session_token_item = get_session_token(current_session_token.token_id)
        assert session_token_item.revoked


class TestAuthDependencies:
    def test_get_current_user_w_valid_session(self, mock_db, default_enabled_user_in_db):
        current_session_token = create_current_session_token(mock_db, default_enabled_user_in_db.google_id)

        session_user = get_current_user_session(current_session_token.token_id)
        assert session_user.google_id == default_enabled_user_in_db.google_id

    def test_get_current_user_w_expired_session(self, mock_db, default_enabled_user_in_db):
        expired_session_token = create_expired_session_token(mock_db, default_enabled_user_in_db.google_id)

        with pytest.raises(HTTPException):
            get_current_user_session(expired_session_token)

    def test_get_current_user_w_revoked_session(self, mock_db, default_enabled_user_in_db):
        current_session_token = create_revoked_session_token(mock_db, default_enabled_user_in_db.google_id)

        with pytest.raises(HTTPException):
            get_current_user_session(current_session_token.token_id)

    def test_get_current_user_w_no_session(self, default_enabled_user_in_db):
        with pytest.raises(HTTPException):
            get_current_user_session("")

    def test_get_current_user_w_invalid_user(self, mock_db):
        current_session_token = create_current_session_token(mock_db, user_id="invalid_user_id")

        with pytest.raises(HTTPException):
            get_current_user_session(current_session_token.token_id)

    def test_get_current_user_w_disabled_user(self, mock_db, default_disabled_user_in_db):
        current_session_token = create_current_session_token(mock_db, user_id=default_disabled_user_in_db.google_id)

        with pytest.raises(HTTPException):
            get_current_user_session(current_session_token.token_id)
