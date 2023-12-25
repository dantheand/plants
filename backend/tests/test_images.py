import io
import tempfile
import uuid

from PIL import Image

from backend.plant_api.constants import S3_BUCKET_NAME
from backend.plant_api.routers.new_images import MAX_X_PIXELS
from backend.plant_api.utils.schema import ImageItem
from backend.tests.lib import DEFAULT_TEST_USER, OTHER_TEST_USER, client, create_fake_plant_record, mock_db, fake_s3


def create_test_image(size=(100, 100)):
    # Create a simple image for testing
    file = io.BytesIO()
    image = Image.new("RGB", size, color="red")
    image.save(file, "PNG")
    file.name = "test.png"
    file.seek(0)
    return file


class TestImageRead:
    def test_get_image_link_for_plant(self, client, mock_db):
        ...

    def test_get_image_link_for_other_user_ok(self):
        ...

    def test_get_all_image_links_for_plant(self, client, mock_db):
        ...


class TestImageUpload:
    def test_upload_image_for_plant(self, client, mock_db, fake_s3):
        # Create mock plant to upload image to
        plant_id = uuid.uuid4()
        plant = create_fake_plant_record(plant_id=plant_id, user_id=DEFAULT_TEST_USER.google_id)
        mock_db.insert_mock_data(plant)

        test_image = create_test_image()
        response = client(DEFAULT_TEST_USER).post(
            f"/new_images/{plant_id}", files={"image_file": ("filename", test_image, "image/png")}
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
            Key={"PK": parsed_response.PK, "SK": parsed_response.SK}
        )["Item"]
        assert image_in_db == parsed_response.model_dump()

    def test_cant_upload_image_for_other_users_plant(self, mock_db, client):
        # Create mock plant to upload image to
        plant_id = uuid.uuid4()
        plant = create_fake_plant_record(plant_id=plant_id, user_id=DEFAULT_TEST_USER.google_id)
        mock_db.insert_mock_data(plant)

        test_image = create_test_image()
        response = client(OTHER_TEST_USER).post(
            f"/new_images/{plant_id}", files={"image_file": ("filename", test_image, "image/png")}
        )
        assert response.status_code == 404

    def test_cannot_upload_image_for_non_existent_plant(self, client, mock_db):
        non_existent_plant_id = uuid.uuid4()

        test_image = create_test_image()
        response = client(DEFAULT_TEST_USER).post(
            f"/new_images/{non_existent_plant_id}", files={"image_file": ("filename", test_image, "image/png")}
        )
        assert response.status_code == 404

    def test_thumbnail_creation(self, client, mock_db, fake_s3):

        plant_id = uuid.uuid4()
        plant = create_fake_plant_record(plant_id=plant_id, user_id=DEFAULT_TEST_USER.google_id)
        mock_db.insert_mock_data(plant)

        image_size = (MAX_X_PIXELS + 10, MAX_X_PIXELS + 10)
        test_image = create_test_image(image_size)
        response = client(DEFAULT_TEST_USER).post(
            f"/new_images/{plant_id}", files={"image_file": ("filename", test_image, "image/png")}
        )
        parsed_response = ImageItem(**response.json())

        # Download full image from S3 and check size
        with tempfile.NamedTemporaryFile() as f:
            fake_s3.download_file(Bucket=S3_BUCKET_NAME, Key=parsed_response.full_photo_s3_url, Filename=f.name)
            with open(f.name, "rb") as image:
                full_image = Image.open(image)
                assert full_image.size == image_size

        # Download thumbnail from S3 and check size
        with tempfile.NamedTemporaryFile() as f:
            fake_s3.download_file(Bucket=S3_BUCKET_NAME, Key=parsed_response.thumbnail_photo_s3_url, Filename=f.name)
            with open(f.name, "rb") as image:
                thumbnail = Image.open(image)
                assert thumbnail.size == (MAX_X_PIXELS, MAX_X_PIXELS)


class TestImageDelete:
    def test_delete_image(self):
        ...

    def test_delete_image_fails_if_not_owner(self):
        ...
