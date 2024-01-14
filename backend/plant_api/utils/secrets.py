import logging

import boto3
from botocore.exceptions import ClientError


def get_aws_secret(secret_name: str):
    region_name = "us-west-2"

    # Create a Secrets Manager client
    session = boto3.session.Session()
    client = session.client(service_name="secretsmanager", region_name=region_name)

    try:
        get_secret_value_response = client.get_secret_value(SecretId=secret_name)
    except ClientError as e:
        logging.error("Could not get secret from AWS Secrets Manager.")
        raise e

    return get_secret_value_response["SecretString"]
