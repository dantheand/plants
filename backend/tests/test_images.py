import io
import tempfile
import uuid

from PIL import Image as img
from pydantic import TypeAdapter
from starlette import status

from backend.plant_api.constants import S3_BUCKET_NAME
from backend.plant_api.routers.new_images import MAX_X_PIXELS, _orient_image
from backend.plant_api.utils.db import make_image_query_key
from backend.plant_api.utils.schema import ImageItem
from backend.tests.lib import (
    DEFAULT_TEST_USER,
    OTHER_TEST_USER,
    TEST_FIXTURE_DIR,
    client,
    image_record_factory,
    plant_record_factory,
    mock_db,
    fake_s3,
)


def create_test_image(size=(100, 100)):
    # Create a simple image for testing
    file = io.BytesIO()
    image = img.new("RGB", size, color="red")
    image.save(file, "PNG")
    file.name = "test.png"
    file.seek(0)
    return file


class TestImageRead:
    def test_get_image_link(self, client, mock_db):
        image_id = uuid.uuid4()
        image = image_record_factory(image_id=image_id)
        mock_db.insert_mock_data(image)

        test_client = client(DEFAULT_TEST_USER)
        response = test_client.get(f"/new_images/{image_id}")
        assert response.status_code == 200
        parsed_response = ImageItem(**response.json())
        assert parsed_response.SK == f"IMAGE#{image_id}"

    def test_get_all_image_links_for_plant(self, client, mock_db):
        plant = plant_record_factory()
        mock_db.insert_mock_data(plant)

        image_list = [image_record_factory(plant_id=plant.plant_id) for _ in range(10)]
        for image in image_list:
            mock_db.insert_mock_data(image)

        test_client = client(DEFAULT_TEST_USER)
        response = test_client.get(f"/new_images/plants/{plant.plant_id}")
        assert response.status_code == 200
        parsed_response = TypeAdapter(list[ImageItem]).validate_python(response.json())
        assert len(parsed_response) == 10
        for image in parsed_response:
            assert image.PK == f"PLANT#{plant.plant_id}"

    def test_get_images_for_other_users_plant_ok(self, mock_db, client):
        plant_user_id = DEFAULT_TEST_USER.google_id
        plant = plant_record_factory(user_id=plant_user_id)
        mock_db.insert_mock_data(plant)

        image_list = [image_record_factory(plant_id=plant.plant_id) for _ in range(10)]
        for image in image_list:
            mock_db.insert_mock_data(image)

        test_client = client(OTHER_TEST_USER)
        response = test_client.get(f"/new_images/plants/{plant.plant_id}")
        assert response.status_code == 200
        parsed_response = TypeAdapter(list[ImageItem]).validate_python(response.json())
        assert len(parsed_response) == 10
        for image in parsed_response:
            assert image.PK == f"PLANT#{plant.plant_id}"


class TestImageUpload:
    def test_upload_image_for_plant(self, client, mock_db, fake_s3):
        plant_id = uuid.uuid4()
        plant = plant_record_factory(plant_id=plant_id, user_id=DEFAULT_TEST_USER.google_id)
        mock_db.insert_mock_data(plant)

        test_image = create_test_image()
        response = client(DEFAULT_TEST_USER).post(
            f"/new_images/plants/{plant_id}",
            files={"image_file": ("filename", test_image, "image/png")},
        )
        assert response.status_code == 200
        parsed_response = ImageItem(**response.json())

        assert parsed_response.PK == f"PLANT#{plant_id}"

        # Check that the images were uploaded to S3
        assert (
            fake_s3.head_object(Bucket=S3_BUCKET_NAME, Key=parsed_response.full_photo_s3_url)["ResponseMetadata"][
                "HTTPStatusCode"
            ]
            == 200
        )
        assert (
            fake_s3.head_object(Bucket=S3_BUCKET_NAME, Key=parsed_response.thumbnail_photo_s3_url)["ResponseMetadata"][
                "HTTPStatusCode"
            ]
            == 200
        )

        # Check that the image was saved to the database
        image_in_db = mock_db.dynamodb.Table(mock_db.table_name).get_item(
            Key=make_image_query_key(plant_id=plant_id, image_id=uuid.UUID(parsed_response.image_id))
        )["Item"]
        assert image_in_db == parsed_response.model_dump()

    def test_cant_upload_image_for_other_users_plant(self, mock_db, client):
        # Create mock plant to upload image to
        plant_id = uuid.uuid4()
        plant = plant_record_factory(plant_id=plant_id, user_id=DEFAULT_TEST_USER.google_id)
        mock_db.insert_mock_data(plant)

        test_image = create_test_image()
        response = client(OTHER_TEST_USER).post(
            f"/new_images/plants/{plant_id}", files={"image_file": ("filename", test_image, "image/png")}
        )
        assert response.status_code == 404

    def test_cannot_upload_image_for_non_existent_plant(self, client, mock_db):
        non_existent_plant_id = uuid.uuid4()

        test_image = create_test_image()
        response = client(DEFAULT_TEST_USER).post(
            f"/new_images/plants/{non_existent_plant_id}", files={"image_file": ("filename", test_image, "image/png")}
        )
        assert response.status_code == 404

    def test_thumbnail_creation(self, client, mock_db, fake_s3):
        plant_id = uuid.uuid4()
        plant = plant_record_factory(plant_id=plant_id, user_id=DEFAULT_TEST_USER.google_id)
        mock_db.insert_mock_data(plant)

        image_size = (MAX_X_PIXELS + 10, MAX_X_PIXELS + 10)
        test_image = create_test_image(image_size)
        response = client(DEFAULT_TEST_USER).post(
            f"/new_images/plants/{plant_id}", files={"image_file": ("filename", test_image, "image/png")}
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
                assert thumbnail.size == (MAX_X_PIXELS, MAX_X_PIXELS)

    def test_upload_image_w_timestamp(self, mock_db, client, fake_s3):
        plant = plant_record_factory()
        mock_db.insert_mock_data(plant)
        timestamp = "2005-06-18T00:59:59.408150"

        test_image = create_test_image()
        response = client(DEFAULT_TEST_USER).post(
            f"/new_images/plants/{plant.plant_id}",
            data={"timestamp": timestamp},
            files={"image_file": ("filename", test_image, "image/png")},
        )
        assert response.status_code == 200
        parsed_response = ImageItem(**response.json())
        assert parsed_response.timestamp == timestamp


class TestImageDelete:
    def test_delete_image(self, mock_db, client):
        plant = plant_record_factory()
        image_id = uuid.uuid4()
        image = image_record_factory(plant_id=plant.plant_id, image_id=image_id)
        mock_db.insert_mock_data(plant)
        mock_db.insert_mock_data(image)

        # Check that the image was saved
        db_query = {"PK": image.PK, "SK": image.SK}
        image_in_db = mock_db.dynamodb.Table(mock_db.table_name).get_item(Key=db_query).get("Item")
        assert image_in_db == image.model_dump()

        response = client(DEFAULT_TEST_USER).delete(f"/new_images/{image_id}")
        assert response.status_code == status.HTTP_204_NO_CONTENT

        # Check that the image was deleted by scanning the table
        image_in_db = mock_db.dynamodb.Table(mock_db.table_name).get_item(Key=db_query).get("Item")
        assert image_in_db is None

    def test_delete_image_fails_if_not_owner(self, mock_db, client):
        user_id = DEFAULT_TEST_USER.google_id
        plant = plant_record_factory(user_id=user_id)
        image_id = uuid.uuid4()
        image = image_record_factory(plant_id=plant.plant_id, image_id=image_id)
        mock_db.insert_mock_data(plant)
        mock_db.insert_mock_data(image)

        response = client(OTHER_TEST_USER).delete(f"/new_images/{image_id}")
        assert response.status_code == status.HTTP_403_FORBIDDEN

    def test_delete_non_existant_image(self, mock_db, client):
        plant = plant_record_factory()
        mock_db.insert_mock_data(plant)

        response = client(DEFAULT_TEST_USER).delete(f"/new_images/{uuid.uuid4()}")
        assert response.status_code == status.HTTP_404_NOT_FOUND

    def test_delete_image_deletes_s3_files(self):
        ...


class TestImageUpdate:
    def test_update_image_timestamp(self, mock_db, client):
        plant = plant_record_factory()
        image_id = uuid.uuid4()
        image = image_record_factory(plant_id=plant.plant_id, image_id=image_id)
        mock_db.insert_mock_data(plant)
        mock_db.insert_mock_data(image)

        updated_image = ImageItem(**image.model_dump())
        updated_image.timestamp = "2005-06-18T00:59:59.408150"

        response = client(DEFAULT_TEST_USER).patch(f"/new_images/{image_id}", json=updated_image.model_dump())
        parsed_response = ImageItem(**response.json())
        assert response.status_code == status.HTTP_200_OK
        assert parsed_response.timestamp == updated_image.timestamp

    def test_update_image_fails_if_not_plant_owner(self, mock_db, client):
        user_id = DEFAULT_TEST_USER.google_id
        image_id = uuid.uuid4()
        plant = plant_record_factory(user_id=user_id)
        image = image_record_factory(plant_id=plant.plant_id, image_id=image_id)
        mock_db.insert_mock_data(plant)
        mock_db.insert_mock_data(image)

        updated_image = ImageItem(**image.model_dump())
        updated_image.timestamp = "2005-06-18T00:59:59.408150"

        response = client(OTHER_TEST_USER).patch(f"/new_images/{image_id}", json=updated_image.model_dump())
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
