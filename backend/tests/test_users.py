from tests.lib import DEFAULT_TEST_USER
from plant_api.schema import UserItem
from plant_api.utils.db import get_all_users, get_db_table, get_user_by_google_id

import pytest


class TestAddUser:
    def test_add_new_user_on_first_login(self, client_no_jwt, mock_db, mock_google_oauth):
        # Note: mock_google_oauth returns DEFAULT_TEST_USER info
        response = client_no_jwt().post(
            "/token",
            json={"token": "mock_oauth2_token", "nonce": "mock_nonce"},
        )
        # Should not be able to login without being set as disabled=False
        assert response.status_code == 401

        # Assert that the user is added to the DB
        db_items = get_db_table().scan()["Items"]
        assert len(db_items) == 1
        parsed_user = UserItem(**db_items[0])

        assert parsed_user.google_id == DEFAULT_TEST_USER.google_id
        assert parsed_user.email == DEFAULT_TEST_USER.email
        # Assert that the user is entered as "disabled" in the DB
        assert parsed_user.disabled is True

    def test_dont_add_user_on_login_if_already_exists(
        self, default_enabled_user_in_db, client_no_jwt, mock_db, mock_google_oauth
    ):
        # Note: mock_google_oauth returns DEFAULT_TEST_USER info
        response = client_no_jwt().post(
            "/token",
            json={"token": "mock_oauth2_token", "nonce": "mock_nonce"},
        )
        assert response.status_code == 200

        users = get_all_users()
        assert len(users) == 1


class TestReadUser:
    def test_read_user(self, default_enabled_user_in_db):
        user = get_user_by_google_id(DEFAULT_TEST_USER.google_id)
        assert user.google_id == DEFAULT_TEST_USER.google_id

    def test_read_users_works_with_plant(self, default_enabled_user_in_db, default_user_plant):
        """This was a problem because plants and users have the same PK
        ... I really need to migrate to postgres
        """
        user = get_user_by_google_id(DEFAULT_TEST_USER.google_id)
        assert user.google_id == DEFAULT_TEST_USER.google_id
