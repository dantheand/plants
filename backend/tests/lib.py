import io
import uuid
from datetime import date, datetime
from typing import Optional

from botocore.exceptions import ClientError
from PIL import Image as img
from faker import Faker
from PIL.Image import Image

from plant_api.routers.images import ImageSuffixes, make_s3_path_for_image, upload_image_to_s3

# from plant_api.main import app
from plant_api.schema import EntityType, ImageItem, ItemKeys, PlantItem, User

TEST_FIXTURE_DIR = "./tests/fixture_data/"
TEST_JWT_SECRET = "test_secret_d151f3b184e25d3318551697d9d62cb7a6ed86035bc60ace38b5bb510802ba37"

fake = Faker()
DEFAULT_TEST_USER = User(email="test@testing.com", google_id="123", disabled=False)
OTHER_TEST_USER = User(email="other@testing.com", google_id="321", disabled=False)

# Define a unique sentinel object for default values
_NO_VALUE = object()


def plant_record_factory(
    human_name: Optional[str] = _NO_VALUE,
    human_id: Optional[int] = _NO_VALUE,
    species: Optional[str] = _NO_VALUE,
    location: Optional[str] = _NO_VALUE,
    source: Optional[str] = _NO_VALUE,
    source_date: Optional[date] = _NO_VALUE,
    sink: Optional[str] = _NO_VALUE,
    sink_date: Optional[date] = _NO_VALUE,
    notes: Optional[str] = _NO_VALUE,
    user_id: Optional[str] = _NO_VALUE,
    plant_id: Optional[uuid.UUID] = _NO_VALUE,
) -> PlantItem:
    return PlantItem(
        human_name=human_name if human_name is not _NO_VALUE else fake.name(),
        human_id=human_id if human_id is not _NO_VALUE else fake.random_int(min=1, max=100000),
        species=species if species is not _NO_VALUE else fake.word(),
        location=location if location is not _NO_VALUE else fake.word(),
        source=source if source is not _NO_VALUE else fake.word(),
        source_date=source_date if source_date is not _NO_VALUE else fake.date(),
        sink=sink if sink is not _NO_VALUE else fake.word(),
        sink_date=sink_date if sink_date is not _NO_VALUE else fake.date(),
        notes=notes if notes is not _NO_VALUE else fake.text(),
        PK=f"{ItemKeys.USER}#{user_id if user_id is not _NO_VALUE else DEFAULT_TEST_USER.google_id}",
        SK=f"{ItemKeys.PLANT}#{plant_id if plant_id is not _NO_VALUE else fake.uuid4()}",
        entity_type=EntityType.PLANT,
    )


def image_record_factory(
    plant_id: Optional[uuid.UUID] = None,
    image_id: Optional[uuid.UUID] = None,
    full_photo_s3_url: Optional[str] = None,
    thumbnail_photo_s3_url: Optional[str] = None,
    timestamp: Optional[datetime] = None,
) -> ImageItem:
    if plant_id is None:
        plant_id = fake.uuid4()
    if image_id is None:
        image_id = fake.uuid4()
    return ImageItem(
        PK=f"{ItemKeys.PLANT}#{plant_id}",
        SK=f"{ItemKeys.IMAGE}#{image_id}",
        entity_type=EntityType.IMAGE,
        full_photo_s3_url=full_photo_s3_url or make_s3_path_for_image(image_id, plant_id, ImageSuffixes.ORIGINAL),
        thumbnail_photo_s3_url=(
            thumbnail_photo_s3_url or make_s3_path_for_image(image_id, plant_id, ImageSuffixes.THUMB)
        ),
        timestamp=timestamp or fake.date_time(),
    )


def create_test_image(size=(100, 100)):
    # Create a simple image for testing
    file = io.BytesIO()
    image = img.new("RGB", size, color="red")
    image.save(file, "PNG")
    file.name = "test.png"
    file.seek(0)
    return file


def image_in_s3_factory(
    image: Optional[Image] = None,
    image_id: Optional[uuid.UUID] = None,
    plant_id: Optional[uuid.UUID] = None,
):
    if image is None:
        image = img.open(io.BytesIO(create_test_image().read()))
    if image_id is None:
        image_id = fake.uuid4()
    if plant_id is None:
        plant_id = fake.uuid4()

    _ = upload_image_to_s3(image, image_id, plant_id, ImageSuffixes.ORIGINAL)
    _ = upload_image_to_s3(image, image_id, plant_id, ImageSuffixes.THUMB)


def check_object_exists_in_s3(s3_client, bucket_name: str, object_key: str) -> bool:
    """
    Check if an object exists in an S3 bucket.

    True if object exists, False otherwise
    """
    try:
        s3_client.head_object(Bucket=bucket_name, Key=object_key)
        return True
    except ClientError as e:
        # Check if the error was because the object does not exist
        error_code = e.response["Error"]["Code"]
        if error_code == "404":
            return False
        else:
            raise  # re-raise if it's a different error
