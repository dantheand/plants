import tempfile
import uuid
from datetime import datetime

from PIL import Image as img
from pydantic import TypeAdapter
from starlette import status

from tests.conftest import create_and_insert_image_record
from plant_api.constants import S3_BUCKET_NAME
from plant_api.routers.images import MAX_THUMB_X_PIXELS, _orient_image
from plant_api.utils.db import make_image_query_key
from plant_api.schema import ImageItem
from tests.lib import (
    check_object_exists_in_s3,
    create_test_image,
    DEFAULT_TEST_USER,
    OTHER_TEST_USER,
    TEST_FIXTURE_DIR,
)


class TestImageRead:
    def test_get_image_link(self, client_mock_session, mock_db, image_record):
        image = image_record

        test_client = client_mock_session(DEFAULT_TEST_USER)
        response = test_client.get(f"/images/{image.image_id}")
        assert response.status_code == 200
        parsed_response = ImageItem(**response.json())
        assert parsed_response.SK == f"IMAGE#{image.image_id}"

    def test_get_all_image_links_for_plant(self, client_mock_session, mock_db, default_user_plant):
        plant = default_user_plant
        for _ in range(10):
            create_and_insert_image_record(mock_db, plant_id=plant.plant_id)

        test_client = client_mock_session(DEFAULT_TEST_USER)
        response = test_client.get(f"/images/plants/{plant.plant_id}")
        assert response.status_code == 200
        parsed_response = TypeAdapter(list[ImageItem]).validate_python(response.json())
        assert len(parsed_response) == 10
        for image in parsed_response:
            assert image.PK == f"PLANT#{plant.plant_id}"

    def test_get_images_for_other_users_plant_ok(
        self, mock_db, client_mock_session, default_enabled_user_in_db, default_user_plant
    ):
        plant = default_user_plant
        for _ in range(10):
            create_and_insert_image_record(mock_db, plant_id=plant.plant_id)

        test_client = client_mock_session(OTHER_TEST_USER)
        response = test_client.get(f"/images/plants/{plant.plant_id}")
        assert response.status_code == 200
        parsed_response = TypeAdapter(list[ImageItem]).validate_python(response.json())
        assert len(parsed_response) == 10
        for image in parsed_response:
            assert image.PK == f"PLANT#{plant.plant_id}"

    def test_get_plant_wo_images(self, mock_db, client_mock_session, default_user_plant):
        plant = default_user_plant

        test_client = client_mock_session(DEFAULT_TEST_USER)
        response = test_client.get(f"/images/plants/{plant.plant_id}")
        assert response.status_code == 404

    # TODO: make these tests work with the new async dynamodb and s3 client
    # def test_get_most_recent_image_for_plant(self, mock_db, client_mock_session, default_user_plant):
    #     plant = default_user_plant
    #     timestamps = [
    #         datetime(2020, 1, 1, 12, 0, 0),
    #         datetime(2020, 1, 1, 12, 0, 2),
    #         datetime(2020, 1, 1, 12, 0, 1),
    #     ]
    #     for timestamp in timestamps:
    #         create_and_insert_image_record(mock_db, plant_id=plant.plant_id, timestamp=timestamp)
    #
    #     test_client = client_mock_session(DEFAULT_TEST_USER)
    #     response = test_client.post(f"/images/plants/most_recent", json=[plant.plant_id])
    #     assert response.status_code == 200
    #     parsed_response = TypeAdapter(list[ImageItem]).validate_python(response.json())
    #     assert parsed_response[0].plant_id == plant.plant_id
    #     assert parsed_response[0].timestamp == timestamps[1]
    #
    # def test_get_most_recent_image_for_plant_with_no_images(self, mock_db, client_mock_session, default_user_plant):
    #     plant = default_user_plant
    #
    #     test_client = client_mock_session(DEFAULT_TEST_USER)
    #     response = test_client.post(f"/images/plants/most_recent", json=[plant.plant_id])
    #     assert response.status_code == 200
    #     parsed_response = TypeAdapter(list[ImageItem]).validate_python(response.json())
    #     assert parsed_response == []


class TestImageUpload:
    def test_upload_image_for_plant(self, client_mock_session, mock_db, fake_s3, default_user_plant):
        plant = default_user_plant

        test_image = create_test_image()
        response = client_mock_session(DEFAULT_TEST_USER).post(
            f"/images/plants/{plant.plant_id}",
            files={"image_file": ("filename", test_image, "image/png")},
        )
        assert response.status_code == 200
        parsed_response = ImageItem(**response.json())

        assert parsed_response.PK == f"PLANT#{plant.plant_id}"

        # Check that the images were uploaded to S3
        assert check_object_exists_in_s3(fake_s3, S3_BUCKET_NAME, parsed_response.full_photo_s3_url) is True
        assert check_object_exists_in_s3(fake_s3, S3_BUCKET_NAME, parsed_response.thumbnail_photo_s3_url) is True

        # Check that the image was saved to the database
        image_in_db = mock_db.dynamodb.Table(mock_db.table_name).get_item(
            Key=make_image_query_key(plant_id=plant.plant_id, image_id=uuid.UUID(parsed_response.image_id))
        )["Item"]
        assert image_in_db == parsed_response.dynamodb_dump()

    def test_cant_upload_image_for_other_users_plant(self, mock_db, client_mock_session, default_user_plant):
        plant = default_user_plant

        test_image = create_test_image()
        response = client_mock_session(OTHER_TEST_USER).post(
            f"/images/plants/{plant.plant_id}", files={"image_file": ("filename", test_image, "image/png")}
        )
        assert response.status_code == 404

    def test_cannot_upload_image_for_non_existent_plant(self, client_mock_session, mock_db):
        non_existent_plant_id = uuid.uuid4()

        test_image = create_test_image()
        response = client_mock_session(DEFAULT_TEST_USER).post(
            f"/images/plants/{non_existent_plant_id}", files={"image_file": ("filename", test_image, "image/png")}
        )
        assert response.status_code == 404

    def test_thumbnail_creation(self, client_mock_session, mock_db, fake_s3, default_user_plant):
        plant = default_user_plant

        image_size = (MAX_THUMB_X_PIXELS + 10, MAX_THUMB_X_PIXELS + 10)
        test_image = create_test_image(image_size)
        response = client_mock_session(DEFAULT_TEST_USER).post(
            f"/images/plants/{plant.plant_id}", files={"image_file": ("filename", test_image, "image/png")}
        )
        parsed_response = ImageItem(**response.json())

        # Download full image from S3 and check size
        with tempfile.NamedTemporaryFile() as f:
            fake_s3.download_file(Bucket=S3_BUCKET_NAME, Key=parsed_response.full_photo_s3_url, Filename=f.name)
            with open(f.name, "rb") as image:
                full_image = img.open(image)
                assert full_image.size == image_size

        # Download thumbnail from S3 and check size
        with tempfile.NamedTemporaryFile() as f:
            fake_s3.download_file(Bucket=S3_BUCKET_NAME, Key=parsed_response.thumbnail_photo_s3_url, Filename=f.name)
            with open(f.name, "rb") as image:
                thumbnail = img.open(image)
                assert thumbnail.size == (MAX_THUMB_X_PIXELS, MAX_THUMB_X_PIXELS)

    def test_upload_image_w_timestamp(self, mock_db, client_mock_session, fake_s3, default_user_plant):
        plant = default_user_plant
        timestamp = "2005-06-18T00:59:59.408150"

        test_image = create_test_image()
        response = client_mock_session(DEFAULT_TEST_USER).post(
            f"/images/plants/{plant.plant_id}",
            data={"timestamp": timestamp},
            files={"image_file": ("filename", test_image, "image/png")},
        )
        assert response.status_code == 200
        parsed_response = ImageItem(**response.json())
        assert parsed_response.dynamodb_dump()["timestamp"] == timestamp


class TestImageDelete:
    def test_delete_image_from_db(self, mock_db, client_mock_session, fake_s3, plant_with_image_record):
        plant, image = plant_with_image_record

        # Check that the image was saved
        db_query = {"PK": image.PK, "SK": image.SK}
        image_in_db = mock_db.dynamodb.Table(mock_db.table_name).get_item(Key=db_query).get("Item")
        assert image_in_db == image.dynamodb_dump()

        response = client_mock_session(DEFAULT_TEST_USER).delete(f"/images/{image.image_id}")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Check that the image was deleted by scanning the table
        image_in_db = mock_db.dynamodb.Table(mock_db.table_name).get_item(Key=db_query).get("Item")
        assert image_in_db is None

    def test_delete_image_fails_if_not_owner(self, mock_db, client_mock_session, plant_with_image_record):
        _, image = plant_with_image_record

        response = client_mock_session(OTHER_TEST_USER).delete(f"/images/{image.image_id}")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_non_existant_image(self, mock_db, client_mock_session):

        response = client_mock_session(DEFAULT_TEST_USER).delete(f"/images/{uuid.uuid4()}")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_image_deletes_s3_files(self, mock_db, client_mock_session, fake_s3, plant_with_image_in_s3):
        plant, image = plant_with_image_in_s3

        # Check that the image was uploaded to S3
        assert check_object_exists_in_s3(fake_s3, S3_BUCKET_NAME, image.full_photo_s3_url) is True
        assert check_object_exists_in_s3(fake_s3, S3_BUCKET_NAME, image.thumbnail_photo_s3_url) is True

        _ = client_mock_session(DEFAULT_TEST_USER).delete(f"/images/{image.image_id}")

        # Make sure it was deleted from S3
        assert check_object_exists_in_s3(fake_s3, S3_BUCKET_NAME, image.full_photo_s3_url) is False
        assert check_object_exists_in_s3(fake_s3, S3_BUCKET_NAME, image.thumbnail_photo_s3_url) is False


class TestImageUpdate:
    def test_update_image_timestamp(self, mock_db, client_mock_session, plant_with_image_record):
        plant, image = plant_with_image_record

        updated_image = ImageItem(**image.model_dump())
        updated_image.timestamp = datetime(2020, 1, 1, 12, 0, 0)

        response = client_mock_session(DEFAULT_TEST_USER).patch(
            f"/images/{image.image_id}", json=updated_image.dynamodb_dump()
        )
        parsed_response = ImageItem(**response.json())
        assert response.status_code == status.HTTP_200_OK
        assert parsed_response.timestamp == updated_image.timestamp

    def test_update_image_fails_if_not_plant_owner(self, mock_db, client_mock_session, plant_with_image_record):
        plant, image = plant_with_image_record

        updated_image = ImageItem(**image.model_dump())
        updated_image.timestamp = datetime(2020, 1, 1, 12, 0, 0)

        response = client_mock_session(OTHER_TEST_USER).patch(
            f"/images/{image.image_id}", json=updated_image.dynamodb_dump()
        )
        assert response.status_code == status.HTTP_403_FORBIDDEN


class TestUtils:
    def test_set_orientation_from_exif(self):
        # Open the image, apply EXIF orientation, and save to a temporary file
        with img.open(TEST_FIXTURE_DIR + "photo_w_portrait_exif.jpeg") as image:
            reoriented_img = _orient_image(image)
            with tempfile.NamedTemporaryFile(suffix=".jpeg", mode="w+b", delete=False) as tmp_file:
                reoriented_img.save(tmp_file)

        with img.open(tmp_file.name) as saved_img:
            # Add assertions based on the expected orientation
            assert saved_img.width < saved_img.height  # Example assertion
