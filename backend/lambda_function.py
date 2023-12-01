from backend.utils.constants import PLANTS_TABLE_NAME
from backend.utils.dynamodb import scan_table

print("Loading function")


def lambda_handler(event, context):
    plants = scan_table(PLANTS_TABLE_NAME)
    return {"statusCode": 200, "body": plants}


# if __name__ == "__main__":
#     event = {}
#     context = {}
#     print(list_plants(event, context))
