from datetime import date, datetime
from enum import Enum
from typing import Optional, Union

from pydantic import BaseModel, Field, field_validator, validator


############################################
######### New DynamoDB Models ##############
############################################


class EntityType(str, Enum):
    USER = "User"
    PLANT = "Plant"
    IMAGE = "Image"
    LINEAGE = "Lineage"


class SourceType(str, Enum):
    PLANT = "Plant"
    OTHER = "Other"


class SinkType(str, Enum):
    PLANT = "Plant"
    OTHER = "Other"


class UserItem(BaseModel):
    pk: str = Field(..., alias="PK", pattern=r"^USER#")
    sk: str = Field(..., alias="SK", pattern=r"^USER#")
    entity_type: str = Field(EntityType.USER)
    disabled: bool


class PlantBase(BaseModel):
    human_name: str
    species: Optional[str] = None
    location: str
    # Sink can be either another plant (if it is wholly incorporated) or something else (like a gift to someone)
    sink: Optional[str] = None
    sink_date: Optional[date] = None
    notes: Optional[str] = None

    # This is needed because dynamodb can't handle date objects
    @field_validator("sink_date", mode="after")
    @classmethod
    def datetime_to_string(cls, v):
        if isinstance(v, date):
            return v.isoformat()
        return v


class PlantCreate(PlantBase):
    human_id: int  # Must be unique for a given user; cannot be changed


class PlantUpdate(PlantBase):
    pass


class PlantItem(PlantCreate):
    PK: str = Field(..., alias="PK", pattern=r"^USER#")
    SK: str = Field(..., alias="SK", pattern=r"^PLANT#")
    entity_type: str = Field(EntityType.PLANT)


class ImageBase(BaseModel):
    s3_url: str
    signed_url: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    # This is needed because dynamodb can't handle date objects
    @field_validator("timestamp", mode="after")
    @classmethod
    def datetime_to_string(cls, v):
        if isinstance(v, datetime):
            return v.isoformat()
        return v


class ImageItem(ImageBase):
    PK: str = Field(..., alias="PK", pattern=r"^PLANT#")
    SK: str = Field(..., alias="SK", pattern=r"^IMAGE#")
    entity_type: str = Field(EntityType.IMAGE)


class PlantSourceItem(BaseModel):
    pk: str = Field(
        ...,
        alias="PK",
        pattern=r"^PLANT#",
        description="Child's plant key in the link.",
    )
    sk: str = Field(
        ..., alias="SK", pattern=r"^SOURCE#", description="Either the parent plant, or someone/something else"
    )
    entity_type: str = Field(EntityType.LINEAGE)
    source_type: SourceType
    source_date: date


DbModelType = Union[UserItem, PlantItem, ImageItem, PlantSourceItem]


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
