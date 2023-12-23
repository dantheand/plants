import uuid
from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field, field_validator, model_validator, root_validator, validator


############################################
######### New DynamoDB Models ##############
############################################


class ItemKeys(str, Enum):
    USER = "USER"
    PLANT = "PLANT"
    IMAGE = "IMAGE"
    SOURCE = "SOURCE"


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
    pk: str = Field(..., alias="PK", pattern=f"^{ItemKeys.USER}#")
    sk: str = Field(..., alias="SK", pattern=f"^{ItemKeys.USER}#")
    entity_type: str = Field(EntityType.USER)
    disabled: bool


class PlantBase(BaseModel):
    human_name: str
    species: Optional[str] = None
    location: str
    # TODO: Migrate these over to the PlantSourceItem system
    parent_id: Optional[list[int]] = None
    source: str
    source_date: date
    # Sink can be either another plant (if it is wholly incorporated) or something else (like a gift to someone)
    sink: Optional[str] = None
    sink_date: Optional[date] = None
    notes: Optional[str] = None

    # Convert all empty strings to None
    @field_validator("*", mode="before")
    def empty_str_to_none(cls, v):
        if v == "":
            return None
        return v

    # This is needed because dynamodb can't handle date objects
    @field_validator("sink_date", "source_date", mode="after")
    @classmethod
    def datetime_to_string(cls, v):
        if isinstance(v, date):
            return v.isoformat()
        return v

    @field_validator("parent_id", mode="before")
    @classmethod
    def parent_id_to_list_of_int(cls, v):
        if isinstance(v, str):
            return [int(x) for x in v.split(",")]
        return v


class PlantCreate(PlantBase):
    human_id: int  # Must be unique for a given user; cannot be changed


class PlantUpdate(PlantBase):
    pass


class PlantItem(PlantCreate):
    """The DB model for a plant item."""

    PK: str = Field(..., alias="PK", pattern=f"^{ItemKeys.USER}#")
    SK: str = Field(..., alias="SK", pattern=f"^{ItemKeys.PLANT}#")
    entity_type: str = Field(EntityType.PLANT)
    plant_id: Optional[str] = None

    @model_validator(mode="before")
    def extract_plant_id(cls, values: Dict[str, Any]):
        """Break out the plant_id UUID as a separate field"""
        values["plant_id"] = values["SK"].split("#")[1]
        return values


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
    PK: str = Field(..., pattern=f"^{ItemKeys.PLANT}#")
    SK: str = Field(..., pattern=f"^{ItemKeys.IMAGE}#")
    entity_type: str = Field(EntityType.IMAGE)


# TODO: leave this out for now and just keep it simple with source stored as list of human_id in PlantItem
class PlantSourceItem(BaseModel):
    PK: str = Field(
        ...,
        pattern=f"^{ItemKeys.PLANT}#",
        description="Child's plant key in the link.",
    )
    SK: str = Field(
        ..., pattern=f"^{ItemKeys.SOURCE}#", description="Either the parent plant, or someone/something else"
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
    email: str
    google_id: str
    disabled: Optional[bool] = None
