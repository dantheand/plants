from datetime import date, datetime
from typing import Optional

from fastapi import FastAPI
from mangum import Mangum
from pydantic import BaseModel

from backend.utils.constants import PLANTS_TABLE_NAME
from backend.utils.dynamodb import scan_table

app = FastAPI()


class Plant(BaseModel):
    PlantID: str
    HumanName: Optional[str] = None
    Species: Optional[str] = None
    Location: str
    ParentID: Optional[str] = None
    Source: str
    SourceDate: date
    Sink: Optional[str] = None
    SinkDate: Optional[datetime] = None
    Notes: Optional[str] = None


class Image(BaseModel):
    ImageID: str
    PlantID: str
    S3Url: str
    Timestamp: datetime


@app.get("/")
def root():
    return {"message": "Hello World"}


@app.get("/plants")
def get_users():
    plants = scan_table(PLANTS_TABLE_NAME)
    return {"message": plants}


handler = Mangum(app)
