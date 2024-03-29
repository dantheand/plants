import logging
import boto3
from botocore.exceptions import ClientError

from plant_api.constants import S3_BUCKET_NAME
from plant_api.schema import ImageItem

logger = logging.getLogger(__name__)


def get_s3_client():
    return boto3.client("s3")


def create_presigned_url(bucket_name: str, object_name: str, expiration_sec=86400):
    """Generate a presigned URL to share an S3 object"""

    s3_client = get_s3_client()
    try:
        response = s3_client.generate_presigned_url(
            "get_object", Params={"Bucket": bucket_name, "Key": object_name}, ExpiresIn=expiration_sec
        )
    except ClientError as e:
        logging.error(e)
        return None

    return response


async def create_async_presigned_url(session, bucket_name: str, object_name: str, expiration_sec=86400):
    """Generate a presigned URL to share an S3 object"""

    async with session.create_client("s3") as s3:
        try:
            response = await s3.generate_presigned_url(
                "get_object", Params={"Bucket": bucket_name, "Key": object_name}, ExpiresIn=expiration_sec
            )
        except ClientError as e:
            logging.error(e)
            return None

        return response


# TODO switch this over to baby thumbnail
def create_presigned_thumbnail_url(image: ImageItem) -> None:
    image.signed_thumbnail_photo_url = create_presigned_url(S3_BUCKET_NAME, image.thumbnail_photo_s3_url)


async def create_async_presigned_thumbnail_url(session, image: ImageItem) -> None:
    logger.debug(f"Creating presigned URL for image {image.image_id}")
    image.signed_thumbnail_photo_url = await create_async_presigned_url(
        session, S3_BUCKET_NAME, image.thumbnail_photo_s3_url
    )


def create_presigned_urls_for_image(image: ImageItem) -> None:
    image.signed_full_photo_url = create_presigned_url(S3_BUCKET_NAME, image.full_photo_s3_url)
    image.signed_thumbnail_photo_url = create_presigned_url(S3_BUCKET_NAME, image.thumbnail_photo_s3_url)
