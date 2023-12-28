import logging
import boto3
from botocore.exceptions import ClientError

from backend.plant_api.constants import S3_BUCKET_NAME, PLANT_IMAGES_FOLDER
from backend.plant_api.utils.schema import Image, ImageItem


def get_s3_client():
    return boto3.client("s3")


def create_presigned_url(bucket_name: str, object_name: str, expiration_sec=3600):
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


def create_presigned_urls_for_image(image: ImageItem) -> None:
    pass


def assign_presigned_url_to_img(img: Image) -> None:
    """Assigns a presigned URL to the Image object"""
    s3_key = PLANT_IMAGES_FOLDER + "/" + img.S3Url.split("/")[-1]
    img.SignedUrl = create_presigned_url(S3_BUCKET_NAME, s3_key)
