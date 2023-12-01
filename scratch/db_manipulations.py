from datetime import datetime


def convert_plant_source_sink_datetime():
    pass


def convert_to_datetime(date_str: str) -> str:
    # Parse the date string to a datetime object
    date_obj = datetime.strptime(date_str, "%m/%d/%Y")

    # Format the datetime object to the desired format
    formatted_date = date_obj.strftime("%Y-%m-%d")
    return formatted_date


if __name__ == "__main__":
    pass
