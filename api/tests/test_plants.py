import uuid

from pydantic import TypeAdapter

from api.tests.lib import DEFAULT_TEST_USER, OTHER_TEST_USER, client, create_plant_item, mock_db
from api.utils.schema import PlantItem


class TestPlantRead:
    def test_get_your_plant_list(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.email
        plant_list = [create_plant_item(user_id=plant_user_id) for _ in range(10)]
        for plant in plant_list:
            mock_db.insert_mock_data(plant)

        test_client = client(DEFAULT_TEST_USER)
        response = test_client.get(f"/new_plants/{plant_user_id}")
        parsed_response = TypeAdapter(list[PlantItem]).validate_python(response.json())
        assert len(parsed_response) == 10
        assert all(isinstance(item, PlantItem) for item in parsed_response)

    def test_get_other_users_plant_list(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.email
        plant_list = [create_plant_item(user_id=plant_user_id) for _ in range(10)]
        for plant in plant_list:
            mock_db.insert_mock_data(plant)

        test_client = client(OTHER_TEST_USER)
        response = test_client.get(f"/new_plants/{plant_user_id}")
        assert response.status_code == 200

    def test_read_your_plant(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.email
        plant_id = uuid.uuid4()
        plant = create_plant_item(user_id=plant_user_id, plant_id=plant_id)
        mock_db.insert_mock_data(plant)

        test_client = client(DEFAULT_TEST_USER)
        response = test_client.get(f"/new_plants/{plant_user_id}/{plant_id}")
        assert PlantItem(**response.json()).SK == f"PLANT#{plant_id}"
        assert response.status_code == 200

    def test_read_other_users_plant_ok(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.email
        plant_id = uuid.uuid4()
        plant = create_plant_item(user_id=plant_user_id, plant_id=plant_id)
        mock_db.insert_mock_data(plant)

        test_client = client(OTHER_TEST_USER)
        response = test_client.get(f"/new_plants/{plant_user_id}/{plant_id}")
        assert PlantItem(**response.json()).SK == f"PLANT#{plant_id}"
        assert response.status_code == 200

    def test_read_missing_plant(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.email
        plant_id = uuid.uuid4()
        response = client().get(f"/new_plants/{plant_user_id}/{plant_id}")
        assert response.status_code == 404

