from datetime import date, datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, validator

############################################
######### New DynamoDB Models ##############
############################################

"""
User:
PK: User#<email>
SK: User#<email>
entity_type: User
disabled: bool


"""


class EntityType(str, Enum):
    USER = "User"
    PLANT = "Plant"
    IMAGE = "Image"
    LINEAGE = "Lineage"


class UserItem(BaseModel):
    pk: str = Field(..., alias="PK", regex=r"^USER#")
    sk: str = Field(..., alias="SK", regex=r"^USER#")
    entity_type: str = Field(EntityType.USER)
    disabled: bool


class PlantItem(BaseModel):
    pk: str = Field(..., alias="PK", regex=r"^USER#")
    sk: str = Field(..., alias="SK", regex=r"^USER#")
    entity_type: str = Field(EntityType.PLANT)
    # TODO add the rest


class ImageItem(BaseModel):
    pk: str = Field(..., alias="PK", regex=r"^PLANT#")
    sk: str = Field(..., alias="SK", regex=r"^IMAGE#")
    entity_type: str = Field(EntityType.IMAGE)
    timestamp: datetime
    s3_url: str
    signed_url: Optional[str] = None


class PlantLineageItem(BaseModel):
    pk: str = Field(
        ...,
        alias="PK",
        regex=r"^PLANT#",
        description="Partition key, must start with PLANT# and correspond to an offspring PlantItem's pk",
    )
    sk: str = Field(..., alias="SK", regex=r"^PARENT#", description="Sort key, must start with PARENT#")
    entity_type: str = Field(EntityType.LINEAGE)


############################################
############### Original Models #############
############################################


class MyBaseModel(BaseModel):
    @validator("*", pre=True)
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v


class Plant(MyBaseModel):
    PlantID: str
    HumanName: Optional[str] = None
    Species: Optional[str] = None
    Location: str
    ParentID: Optional[str] = None
    Source: str
    SourceDate: str
    Sink: Optional[str] = None
    SinkDate: Optional[datetime] = None
    Notes: Optional[str] = None


class Image(MyBaseModel):
    ImageID: str
    PlantID: str
    S3Url: str
    SignedUrl: Optional[str] = None
    Timestamp: str
    # Timestamp: datetime


class User(BaseModel):
    email: Optional[str] = None
    disabled: Optional[bool] = None
