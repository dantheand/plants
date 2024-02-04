import uuid
from datetime import datetime, timedelta

from jose import jwt

from plant_api.dependencies import decode_jwt_token
from plant_api.routers.auth import create_access_token_for_user
from plant_api.schema import User
from tests.lib import DEFAULT_TEST_USER, TEST_JWT_SECRET
from plant_api.constants import (
    ALGORITHM,
    GoogleOauthPayload,
    JWT_KEY_IN_SECRETS_MANAGER,
    JwtPayload,
    get_jwt_secret,
)
from plant_api.utils.secrets import get_aws_secret


def create_current_access_token() -> str:
    payload = GoogleOauthPayload(
        email=DEFAULT_TEST_USER.email,
        sub=DEFAULT_TEST_USER.google_id,
        given_name=DEFAULT_TEST_USER.given_name,
        family_name=DEFAULT_TEST_USER.family_name,
    )
    current_access_token = create_access_token_for_user(payload)
    return current_access_token


def create_current_session_token(user: User) -> str:
    return jwt.encode(
        JwtPayload(
            email=user.email,
            google_id=user.google_id,
            family_name=user.family_name,
            exp=datetime.utcnow() + timedelta(days=1),
            jti=str(uuid.uuid4()),
        ).model_dump(),
        get_jwt_secret(),
        algorithm=ALGORITHM,
    )


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
        access_token = response.json()["token"]
        decoded_access_token = decode_jwt_token(access_token)

        assert decoded_access_token.google_id == DEFAULT_TEST_USER.google_id

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
