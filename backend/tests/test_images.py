import io
import uuid

from PIL import Image

from backend.plant_api.constants import S3_BUCKET_NAME
from backend.plant_api.routers.new_images import make_s3_path_for_image
from backend.plant_api.utils.schema import ImageItem
from backend.tests.lib import DEFAULT_TEST_USER, OTHER_TEST_USER, client, create_fake_plant, mock_db, fake_s3


def create_test_image(size=(100, 100)):
    # Create a simple image for testing
    file = io.BytesIO()
    image = Image.new("RGB", size, color="red")
    image.save(file, "PNG")
    file.name = "test.png"
    file.seek(0)
    return file


class TestImageRead:
    def test_get_image_for_plant(self, client, mock_db):
        ...

    def test_get_image_for_user_ok(self):
        ...


class TestImageUpload:
    def test_upload_image_for_plant(self, client, mock_db, fake_s3):
        # Create mock plant to upload image to
        fake_plant_id = uuid.uuid4()
        test_image = create_test_image()
        response = client(DEFAULT_TEST_USER).post(
            f"/new_images/{fake_plant_id}", files={"image_file": ("filename", test_image, "image/png")}
        )
        parsed_response = ImageItem(**response.json())

        assert response.status_code == 200
        assert parsed_response.PK == f"PLANT#{fake_plant_id}"

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
        db_item = mock_db.dynamodb.Table(mock_db.table_name).scan()["Items"][0]
        assert db_item == parsed_response.model_dump()

    def test_cannot_upload_image_for_others_plant(self):
        ...

    def test_uploaded_image_resizes(self):
        ...


class TestImageDelete:
    def test_delete_image(self):
        ...

    def test_delete_image_fails_if_not_owner(self):
        ...
