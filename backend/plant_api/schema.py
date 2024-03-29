from datetime import date, datetime
from enum import Enum
from typing import Any, Dict, Optional, Union

from pydantic import BaseModel, Field, field_validator, model_validator

from plant_api.constants import UNSET


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


USER_KEY_PATTERN = f"^{ItemKeys.USER.value}#"
PLANT_KEY_PATTERN = f"^{ItemKeys.PLANT.value}#"
IMAGE_KEY_PATTERN = f"^{ItemKeys.IMAGE.value}#"
SOURCE_KEY_PATTERN = f"^{ItemKeys.SOURCE.value}#"


class DynamoDBMixin(BaseModel):
    def dynamodb_dump(self) -> dict:
        """Returns a dict compatible with DynamoDB"""
        data = self.model_dump()
        for key, value in data.items():
            if isinstance(value, date):
                data[key] = value.isoformat()
        return data


class DeAnonUser(BaseModel):
    google_id: str
    given_name: str
    last_initial: str
    is_public_profile: bool
    created_at: datetime
    n_total_plants: int
    n_active_plants: int


# TODO: try to consolidate User and UserItem
class User(BaseModel):
    email: str
    google_id: str
    given_name: str
    family_name: str
    last_initial: Optional[str] = None
    disabled: Optional[bool] = None
    created_at: datetime
    is_public_profile: Optional[bool] = None
    n_total_plants: Optional[int] = None
    n_active_plants: Optional[int] = None

    @model_validator(mode="before")
    def set_last_initial(cls, values):
        family_name = values.get("family_name")
        if family_name:
            # Set the last initial to the first character of the family name
            values["last_initial"] = family_name[0]
        return values


class UserItem(DynamoDBMixin):
    PK: str = Field(..., pattern=USER_KEY_PATTERN)
    SK: str = Field(..., pattern=USER_KEY_PATTERN)
    email: str
    given_name: str
    family_name: str
    picture: Optional[str] = None
    entity_type: str = Field(EntityType.USER)
    is_public_profile: Optional[bool] = True
    disabled: Optional[bool] = True
    google_id: str
    created_at: datetime

    @model_validator(mode="before")
    def extract_google_id(cls, values: Dict[str, Any]) -> Dict[str, Any]:
        """Break out the google_id UUID as a separate field"""
        values["google_id"] = values["PK"].split("#")[1]
        return values


class PlantBase(DynamoDBMixin):
    human_name: str
    species: Optional[str] = None
    location: Optional[str] = None
    # TODO: Migrate these over to the PlantSourceItem system and convert default factory to empty list
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
    def parent_id_to_list_of_int(cls, v: Union[str, list[int]]) -> Optional[list[int]]:
        if v == "":
            return None
        if isinstance(v, str):
            return [int(x) for x in v.split(",")]
        return v

    @model_validator(mode="after")
    def validate_sink_and_sink_date(self) -> "PlantBase":
        if self.sink is None and self.sink_date is not None:
            raise ValueError("If sink_date is provided, sink must also be provided")
        if self.sink is not None and self.sink_date is None:
            raise ValueError("If sink is provided, sink_date must also be provided")
        return self


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
    user_id: str = UNSET

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
    small_thumbnail_photo_s3_url: Optional[str] = None
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


DbModelType = Union[UserItem, PlantItem, ImageItem, PlantSourceItem]
