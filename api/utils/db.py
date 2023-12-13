import boto3


def get_db_connection():
    return boto3.resource("dynamodb", region_name="us-west-2")


def scan_table(table_name):
    session = get_db_connection()
    table = session.Table(table_name)
    response = table.scan()
    return response["Items"]
