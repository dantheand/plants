import boto3

from api.constants import NEW_PLANTS_TABLE


def get_db_connection():
    return boto3.resource("dynamodb", region_name="us-west-2")


def get_db_table():
    return get_db_connection().Table(NEW_PLANTS_TABLE)


def scan_table(table_name):
    session = get_db_connection()
    table = session.Table(table_name)
    response = table.scan()
    return response["Items"]
