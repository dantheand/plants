import uuid

from pydantic import TypeAdapter
from fastapi import status

from backend.plant_api.routers.new_plants import PLANT_ROUTE
from backend.tests.lib import DEFAULT_TEST_USER, OTHER_TEST_USER, client, create_fake_plant, mock_db
from backend.plant_api.utils.schema import ItemKeys, PlantBase, PlantItem


class TestPlantRead:
    def test_get_your_plant_list(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.google_id
        plant_list = [create_fake_plant(user_id=plant_user_id) for _ in range(10)]
        for plant in plant_list:
            mock_db.insert_mock_data(plant)

        test_client = client(DEFAULT_TEST_USER)
        response = test_client.get(f"{PLANT_ROUTE}/user/{plant_user_id}")
        parsed_response = TypeAdapter(list[PlantItem]).validate_python(response.json())
        assert len(parsed_response) == 10
        assert all(isinstance(item, PlantItem) for item in parsed_response)

    def test_get_other_users_plant_list(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.google_id
        plant_list = [create_fake_plant(user_id=plant_user_id) for _ in range(10)]
        for plant in plant_list:
            mock_db.insert_mock_data(plant)

        test_client = client(OTHER_TEST_USER)
        response = test_client.get(f"{PLANT_ROUTE}/user/{plant_user_id}")
        assert response.status_code == 200

    def test_read_your_plant(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.google_id
        plant_id = uuid.uuid4()
        plant = create_fake_plant(plant_id=plant_id, user_id=plant_user_id)
        mock_db.insert_mock_data(plant)

        test_client = client(DEFAULT_TEST_USER)
        response = test_client.get(f"{PLANT_ROUTE}/{plant_id}")
        assert PlantItem(**response.json()).SK == f"PLANT#{plant_id}"
        assert response.status_code == 200

    def test_read_other_users_plant_ok(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.google_id
        plant_id = uuid.uuid4()
        plant = create_fake_plant(user_id=plant_user_id, plant_id=plant_id)
        mock_db.insert_mock_data(plant)

        test_client = client(OTHER_TEST_USER)
        response = test_client.get(f"{PLANT_ROUTE}/{plant_id}")
        assert PlantItem(**response.json()).SK == f"PLANT#{plant_id}"
        assert response.status_code == 200

    def test_read_missing_plant(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.google_id
        plant_id = uuid.uuid4()
        response = client().get(f"{PLANT_ROUTE}/{plant_user_id}/{plant_id}")
        assert response.status_code == 404


class TestPlantCreate:
    def test_create(self, client, mock_db):
        test_client = client(DEFAULT_TEST_USER)
        new_plant = create_fake_plant(human_name="New Plant")
        response = test_client.post(f"{PLANT_ROUTE}/", json=new_plant.model_dump())
        assert response.status_code == status.HTTP_201_CREATED
        assert response.json()["human_name"] == "New Plant"

        # Check the plant was created in the DB
        db_items = mock_db.dynamodb.Table(mock_db.table_name).scan()["Items"]
        assert len(db_items) == 1
        assert db_items[0]["human_name"] == "New Plant"
        assert db_items[0]["PK"] == f"{ItemKeys.USER}#{DEFAULT_TEST_USER.google_id}"

    def test_create_with_duplicate_human_id_fails(self, client, mock_db):
        test_client = client(DEFAULT_TEST_USER)
        existing_plant = create_fake_plant(human_id=42, user_id=DEFAULT_TEST_USER.google_id)
        mock_db.insert_mock_data(existing_plant)

        new_plant = create_fake_plant(human_id=42)
        response = test_client.post(f"{PLANT_ROUTE}/", json=new_plant.model_dump())
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_create_with_duplicate_plant_id(self, client, mock_db):
        test_client = client(DEFAULT_TEST_USER)
        plant_id = uuid.uuid4()
        existing_plant = create_fake_plant(plant_id=plant_id, user_id=DEFAULT_TEST_USER.google_id)
        mock_db.insert_mock_data(existing_plant)

        new_plant = create_fake_plant(plant_id=plant_id)
        _ = test_client.post(f"{PLANT_ROUTE}/", json=new_plant.model_dump())

        # Check that the plants were created with different UUIDs
        db_items = mock_db.dynamodb.Table(mock_db.table_name).scan()["Items"]
        assert len(db_items) == 2
        assert db_items[0]["plant_id"] != db_items[1]["plant_id"]

    def test_create_missing_required_fields(self, client):
        test_client = client(DEFAULT_TEST_USER)
        new_plant = create_fake_plant()
        new_plant.human_id = None
        response = test_client.post(f"{PLANT_ROUTE}/", json=new_plant.model_dump())
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


class TestPlantUpdate:
    def test_update(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.google_id
        plant_id = uuid.uuid4()
        plant = create_fake_plant(user_id=plant_user_id, plant_id=plant_id, human_name="Original Name")
        mock_db.insert_mock_data(plant)

        test_client = client(DEFAULT_TEST_USER)
        updated_plant = PlantBase(**plant.model_dump())
        updated_plant.human_name = "Updated Name"

        response = test_client.patch(f"{PLANT_ROUTE}/{plant_id}", json=updated_plant.model_dump())
        assert response.status_code == status.HTTP_200_OK

        # Check the plant was updated in the DB
        db_items = mock_db.dynamodb.Table(mock_db.table_name).scan()["Items"]
        assert len(db_items) == 1
        assert db_items[0]["human_name"] == "Updated Name"

    def test_update_other_users_plant_fails(self, client, mock_db):
        # Plant owner user details
        plant_owner_id = DEFAULT_TEST_USER.google_id
        plant_id = uuid.uuid4()
        plant = create_fake_plant(user_id=plant_owner_id, plant_id=plant_id, human_name="Original Name")
        mock_db.insert_mock_data(plant)

        # Another user who is not the owner of the plant
        other_user_client = client(OTHER_TEST_USER)

        updated_plant = PlantBase(**plant.model_dump())
        updated_plant.human_name = "Updated Name"

        response = other_user_client.patch(f"{PLANT_ROUTE}/{plant_id}", json=updated_plant.model_dump())

        # Check that the update is not allowed
        assert response.status_code == status.HTTP_403_FORBIDDEN or response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_missing_plant_fails(self, client, mock_db):
        plant_id = uuid.uuid4()
        updated_plant = PlantBase(**create_fake_plant().model_dump())
        test_client = client()
        response = test_client.patch(f"{PLANT_ROUTE}/{plant_id}", json=updated_plant.model_dump())
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_update_cant_change_human_id(self, mock_db, client):
        plant_id = uuid.uuid4()
        plant = create_fake_plant(plant_id=plant_id, human_id=42)
        mock_db.insert_mock_data(plant)

        updated_plant = plant.model_dump()
        updated_plant["human_id"] = 1

        test_client = client()
        response = test_client.patch(f"{PLANT_ROUTE}/{plant_id}", json=updated_plant)

        # Check that nothing changed
        assert response.status_code == status.HTTP_200_OK
        assert response.json()["human_id"] == 42


class TestPlantDelete:
    def test_delete(self, client, mock_db):
        plant_user_id = DEFAULT_TEST_USER.google_id
        plant_id = uuid.uuid4()
        plant = create_fake_plant(user_id=plant_user_id, plant_id=plant_id)
        mock_db.insert_mock_data(plant)

        test_client = client(DEFAULT_TEST_USER)
        response = test_client.delete(f"{PLANT_ROUTE}/{plant_id}")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Check the plant was deleted from the DB
        db_items = mock_db.dynamodb.Table(mock_db.table_name).scan()["Items"]
        assert len(db_items) == 0

    def test_delete_other_users_plant_fails(self, client, mock_db):
        # Plant owner user details
        plant_owner_id = DEFAULT_TEST_USER.google_id
        plant_id = uuid.uuid4()
        plant = create_fake_plant(user_id=plant_owner_id, plant_id=plant_id)
        mock_db.insert_mock_data(plant)

        # Another user who is not the owner of the plant
        other_user_client = client(OTHER_TEST_USER)

        response = other_user_client.delete(f"{PLANT_ROUTE}/{plant_id}")

        # Check that the delete is not allowed
        assert response.status_code == status.HTTP_403_FORBIDDEN or response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_missing_plant_fails(self, client, mock_db):
        plant_id = uuid.uuid4()
        test_client = client()
        response = test_client.delete(f"{PLANT_ROUTE}/{plant_id}")
        assert response.status_code == status.HTTP_404_NOT_FOUND


class TestParsing:
    def test_parses_mult_parent_id(self):
        plant = PlantItem.model_validate(
            {
                "human_name": "Mid-right kitchen spider plant",
                "species": None,
                "location": "kitchen",
                "parent_id": "20, 22",
                "source": "plant",
                "source_date": "2023-11-25",
                "sink": None,
                "sink_date": None,
                "notes": None,
                "human_id": 9,
                "PK": "USER#106821357176702886816",
                "SK": "PLANT#0cdbdb8a-4cfb-471c-a32a-c31ef98617b2",
                "entity_type": "Plant",
                "plant_id": "0cdbdb8a-4cfb-471c-a32a-c31ef98617b2",
            }
        )
        assert plant.parent_id == [20, 22]
