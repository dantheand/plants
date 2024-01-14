from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, Generic, Optional, TypeVar, Union

from pydantic import BaseModel, Field, field_validator, model_validator


class ItemKeys(str, Enum):
    USER = "USER"
    PLANT = "PLANT"
    IMAGE = "IMAGE"
    SOURCE = "SOURCE"
    REFRESH_TOKEN = "TOKEN"


class EntityType(str, Enum):
    USER = "User"
    PLANT = "Plant"
    IMAGE = "Image"
    LINEAGE = "Lineage"
    REFRESH_TOKEN = "Token"


class SourceType(str, Enum):
    PLANT = "Plant"
    OTHER = "Other"


class SinkType(str, Enum):
    PLANT = "Plant"
    OTHER = "Other"


USER_KEY_PATTERN = f"^{ItemKeys.USER}#"
PLANT_KEY_PATTERN = f"^{ItemKeys.PLANT}#"
IMAGE_KEY_PATTERN = f"^{ItemKeys.IMAGE}#"
SOURCE_KEY_PATTERN = f"^{ItemKeys.SOURCE}#"
REFRESH_TOKEN_KEY_PATTERN = f"^{ItemKeys.REFRESH_TOKEN}#"


class DynamoDBMixin(BaseModel):
    def dynamodb_dump(self) -> dict:
        """Returns a dict compatible with DynamoDB"""
        data = self.model_dump()
        for key, value in data.items():
            if isinstance(value, date):
                data[key] = value.isoformat()
        return data


# TODO: try to consolidate User and UserItem
class User(BaseModel):
    email: str
    google_id: str
    disabled: Optional[bool] = None


class UserItem(DynamoDBMixin):
    PK: str = Field(..., pattern=USER_KEY_PATTERN)
    SK: str = Field(..., pattern=USER_KEY_PATTERN)
    email: str
    entity_type: str = Field(EntityType.USER)
    disabled: Optional[bool] = True
    google_id: Optional[str] = None

    @model_validator(mode="before")
    def extract_google_id(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Break out the google_id UUID as a separate field"""
        values["google_id"] = values["PK"].split("#")[1]
        return values


class PlantBase(DynamoDBMixin):
    human_name: str
    species: Optional[str] = None
    location: Optional[str] = None
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
    def empty_str_to_none(cls, v: Any) -> Optional[Any]:
        if v == "":
            return None
        return v

    @field_validator("parent_id", mode="before")
    @classmethod
    def parent_id_to_list_of_int(cls, v: Union[str, list[int]]) -> list[int]:
        if isinstance(v, str):
            return [int(x) for x in v.split(",")]
        return v


class PlantCreate(PlantBase):
    human_id: int  # Must be unique for a given user; cannot be changed


class PlantUpdate(PlantBase):
    pass


class PlantItem(PlantCreate):
    """The DB model for a plant item."""

    PK: str = Field(..., pattern=USER_KEY_PATTERN)
    SK: str = Field(..., pattern=PLANT_KEY_PATTERN)
    entity_type: str = Field(EntityType.PLANT)
    plant_id: Optional[str] = None
    user_id: Optional[str] = None

    @model_validator(mode="before")
    def extract_plant_id(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Break out the plant_id UUID as a separate field"""
        values["plant_id"] = values["SK"].split("#")[1]
        return values

    @model_validator(mode="before")
    def extract_user_id(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Break out the user_id UUID as a separate field"""
        values["user_id"] = values["PK"].split("#")[1]
        return values


class ImageCreate(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ImageBase(DynamoDBMixin):
    full_photo_s3_url: str
    thumbnail_photo_s3_url: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class ImageItem(ImageBase):
    PK: str = Field(..., pattern=PLANT_KEY_PATTERN)
    SK: str = Field(..., pattern=IMAGE_KEY_PATTERN)
    signed_full_photo_url: Optional[str] = None
    signed_thumbnail_photo_url: Optional[str] = None
    entity_type: str = Field(EntityType.IMAGE)
    image_id: Optional[str] = None
    plant_id: Optional[str] = None

    @model_validator(mode="before")
    def extract_image_id(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Break out the plant_id UUID as a separate field"""
        values["image_id"] = values["SK"].split("#")[1]
        return values

    @model_validator(mode="before")
    def extract_plant_id(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Break out the plant_id UUID as a separate field"""
        values["plant_id"] = values["PK"].split("#")[1]
        return values


class TokenItem(DynamoDBMixin):
    """Refresh token schema"""

    PK: str = Field(..., pattern=REFRESH_TOKEN_KEY_PATTERN)
    SK: str = Field(..., pattern=USER_KEY_PATTERN)
    entity_type: str = Field(EntityType.REFRESH_TOKEN)
    issued_at: datetime
    expires_at: datetime
    revoked: bool = False
    token_str: Optional[str] = None
    user_id: Optional[str] = None

    @model_validator(mode="before")
    def extract_token_str(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        values["token_str"] = values["PK"].split("#")[1]
        return values

    @model_validator(mode="before")
    def extract_user_id(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        values["user_id"] = values["SK"].split("#")[1]
        return values


# TODO: leave this out for now and just keep it simple with source stored as list of human_id in PlantItem
class PlantSourceItem(DynamoDBMixin):
    PK: str = Field(
        ...,
        pattern=PLANT_KEY_PATTERN,
        description="Child's plant key in the link.",
    )
    SK: str = Field(..., pattern=SOURCE_KEY_PATTERN, description="Either the parent plant, or someone/something else")
    entity_type: str = Field(EntityType.LINEAGE)
    source_type: SourceType
    source_date: date


DbModelType = Union[UserItem, PlantItem, ImageItem, PlantSourceItem, TokenItem]
