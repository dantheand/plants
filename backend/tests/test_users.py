from datetime import date

from tests.conftest import create_plants_for_user
from tests.lib import DEFAULT_TEST_USER, OTHER_TEST_USER, plant_record_factory
from plant_api.schema import DeAnonUser, User, UserItem
from plant_api.utils.db import get_all_users, get_db_table, get_user_by_google_id, is_user_access_allowed

from pydantic import TypeAdapter


class TestAddUser:
    def test_add_new_user_on_first_login(self, client_no_session, mock_db, mock_google_oauth):
        # Note: mock_google_oauth returns DEFAULT_TEST_USER info
        response = client_no_session().post(
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
        self, default_enabled_user_in_db, client_no_session, mock_db, mock_google_oauth
    ):
        # Note: mock_google_oauth returns DEFAULT_TEST_USER info
        response = client_no_session().post(
            "/token",
            json={"token": "mock_oauth2_token", "nonce": "mock_nonce"},
        )
        assert response.status_code == 200

        users = get_all_users()
        assert len(users) == 1


class TestGetUsers:
    def test_get_me(self, default_enabled_user_in_db, other_enabled_user_in_db, client_mock_session):
        response = client_mock_session().get("/users/me")
        parsed_response = TypeAdapter(User).validate_python(response.json())

        assert parsed_response.google_id == DEFAULT_TEST_USER.google_id

    def test_get_users(self, default_enabled_user_in_db, other_enabled_user_in_db, client_mock_session):
        response = client_mock_session().get("/users")
        parsed_response = TypeAdapter(list[DeAnonUser]).validate_python(response.json())

        assert len(parsed_response) == 2
        # Assert that both of the users are there
        assert any(user.google_id == DEFAULT_TEST_USER.google_id for user in parsed_response)
        assert any(user.google_id == OTHER_TEST_USER.google_id for user in parsed_response)

    def test_gets_only_active_users(self, default_disabled_user_in_db, other_enabled_user_in_db, client_mock_session):
        response = client_mock_session().get("/users")
        parsed_response = TypeAdapter(list[DeAnonUser]).validate_python(response.json())

        assert len(parsed_response) == 1
        # Assert that only the active user is there
        assert parsed_response[0].google_id == OTHER_TEST_USER.google_id

    def test_get_user_n_plants(self, default_enabled_user_in_db, mock_db, client_mock_session):
        create_plants_for_user(mock_db, DEFAULT_TEST_USER, 3)
        response = client_mock_session().get("/users")
        parsed_user = TypeAdapter(list[DeAnonUser]).validate_python(response.json())

        assert parsed_user[0].n_total_plants == 3

    def test_get_user_without_plants(self, default_enabled_user_in_db, client_mock_session):
        response = client_mock_session().get("/users")
        parsed_user = TypeAdapter(list[DeAnonUser]).validate_python(response.json())

        assert parsed_user[0].n_total_plants == 0

    def test_get_user_w_sunk_plants(self, mock_db, default_enabled_user_in_db, client_mock_session):
        plants = [
            plant_record_factory(human_id=1, sink=None, sink_date=None),
            plant_record_factory(human_id=2, sink="mock_sink", sink_date=date.today()),
        ]
        for plant in plants:
            mock_db.insert_mock_data(plant)

        response = client_mock_session().get("/users")
        parsed_user = TypeAdapter(list[DeAnonUser]).validate_python(response.json())[0]

        assert parsed_user.n_total_plants == 2
        assert parsed_user.n_active_plants == 1

    def test_get_user_returns_deanon_data(self, default_enabled_user_in_db, client_mock_session):
        response = client_mock_session().get("/users")
        parsed_response = TypeAdapter(list[DeAnonUser]).validate_python(response.json())

        assert parsed_response[0].last_initial == DEFAULT_TEST_USER.family_name[0]


class TestUserUpdate:
    def test_change_user_visibility(self, default_enabled_user_in_db, client_mock_session):
        assert default_enabled_user_in_db.is_public_profile is True
        response = client_mock_session().post("/users/settings/visibility", json={"is_public": False})
        assert response.json() == {"visibility": False}

        user = get_user_by_google_id(DEFAULT_TEST_USER.google_id)
        assert user.is_public_profile is False


class TestRestrictedAccess:
    def test_access_allowed_for_self(self, default_enabled_user_in_db):
        assert is_user_access_allowed(default_enabled_user_in_db, default_enabled_user_in_db.google_id) is True

    def test_access_allowed_for_public_user(self, default_enabled_user_in_db, other_enabled_user_in_db):
        assert is_user_access_allowed(default_enabled_user_in_db, other_enabled_user_in_db.google_id) is True

    def test_access_not_allowed_for_private_user(self, default_enabled_user_in_db, other_private_user_in_db):
        assert is_user_access_allowed(default_enabled_user_in_db, other_private_user_in_db.google_id) is False


class TestReadUserDB:
    def test_read_user(self, default_enabled_user_in_db):
        user = get_user_by_google_id(DEFAULT_TEST_USER.google_id)
        assert user.google_id == DEFAULT_TEST_USER.google_id

    def test_read_users_works_with_plant(self, default_enabled_user_in_db, default_user_plant):
        """This was a problem because plants and users have the same PK
        ... I really need to migrate to postgres
        """
        user = get_user_by_google_id(DEFAULT_TEST_USER.google_id)
        assert user.google_id == DEFAULT_TEST_USER.google_id
