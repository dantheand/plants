import uuid
from datetime import datetime, timedelta
from fastapi.exceptions import HTTPException

import pytest
from jose import jwt

from plant_api.dependencies import get_current_user_session
from plant_api.routers.auth import create_access_token_for_user
from plant_api.schema import EntityType, ItemKeys, User
from tests.lib import DEFAULT_TEST_USER, TEST_JWT_SECRET
from plant_api.constants import (
    ALGORITHM,
    GoogleOauthPayload,
    JWT_KEY_IN_SECRETS_MANAGER,
    JwtPayload,
    get_jwt_secret,
    SESSION_TOKEN_KEY,
)
from plant_api.utils.secrets import get_aws_secret


def create_current_access_token() -> str:
    payload = GoogleOauthPayload(email=DEFAULT_TEST_USER.email, sub=DEFAULT_TEST_USER.google_id)
    current_access_token, _ = create_access_token_for_user(payload)
    return current_access_token


def create_current_session_token(user: User) -> str:
    return jwt.encode(
        JwtPayload(
            email=user.email,
            google_id=user.google_id,
            exp=datetime.utcnow() + timedelta(days=1),
            jti=str(uuid.uuid4()),
        ).model_dump(),
        get_jwt_secret(),
        algorithm=ALGORITHM,
    )


#
#
# def create_revoked_session_token(mock_db, user_id: str) -> SessionTokenItem:
#     session_token = SessionTokenItem(
#         PK=f"{ItemKeys.SESSION_TOKEN.value}#{uuid.uuid4()}",
#         SK=f"{ItemKeys.USER.value}#{user_id}",
#         entity_type=EntityType.SESSION_TOKEN,
#         issued_at=datetime.utcnow(),
#         expires_at=datetime.utcnow() + timedelta(days=1),
#         revoked=True,
#     )
#     mock_db.insert_mock_data(session_token)
#     return session_token
#
#
def create_expired_session_token(user: User) -> str:
    return jwt.encode(
        JwtPayload(
            email=user.email,
            google_id=user.google_id,
            exp=datetime.utcnow() - timedelta(days=1),
            jti=str(uuid.uuid4()),
        ).model_dump(),
        get_jwt_secret(),
        algorithm=ALGORITHM,
    )


class TestAWSAccess:
    def test_get_jwt_key(self):
        secret = get_aws_secret(JWT_KEY_IN_SECRETS_MANAGER)
        assert secret == TEST_JWT_SECRET


class TestTokenFlow:
    def test_get_jwt_on_login(self, client_no_session, mock_google_oauth, default_enabled_user_in_db, mock_db):
        mock_oauth2_token = "mock_oauth2_token"
        mock_nonce = "mock_nonce"

        response = client_no_session().post(
            "/token",
            json={"token": mock_oauth2_token, "nonce": mock_nonce},
        )
        assert response.status_code == 200
        access_token = response.json()
        decoded_access_token = jwt.decode(access_token, get_jwt_secret(), algorithms=[ALGORITHM])

        assert decoded_access_token["google_id"] == DEFAULT_TEST_USER.google_id

    def test_check_token_w_valid_token(self, client_no_session, mock_db, default_enabled_user_in_db):
        current_session_token = create_current_session_token(default_enabled_user_in_db)

        response = client_no_session().get("/check_token", headers={"Authorization": f"Bearer {current_session_token}"})

        assert response.status_code == 200
        assert response.json()["google_id"] == default_enabled_user_in_db.google_id

    def test_check_token_w_expired_token(self, client_no_session, default_enabled_user_in_db):
        expired_token = create_expired_session_token(default_enabled_user_in_db)
        response = client_no_session().get("/check_token", headers={"Authorization": f"Bearer {expired_token}"})

        assert response.status_code == 401

    def test_check_token_w_disabled_user(self, client_no_session, default_disabled_user_in_db):
        current_session_token = create_current_session_token(default_disabled_user_in_db)
        response = client_no_session().get("/check_token", headers={"Authorization": f"Bearer {current_session_token}"})

        assert response.status_code == 401
