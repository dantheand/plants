import logging
from typing import Optional
from uuid import UUID

from plant_api.routers.common import BaseRouter
from plant_api.dependencies import get_current_user_session
from pydantic import BaseModel

from fastapi import Depends

from plant_api.routers.plants import read_all_plants_for_user

logger = logging.getLogger(__name__)


router = BaseRouter(
    prefix="/lineages",
    dependencies=[Depends(get_current_user_session)],
    responses={404: {"description": "Not found"}},
)


class PlantLineageNode(BaseModel):
    id: int  # this is the human_id
    generation: Optional[int] = None
    parents: Optional[list[int]] = None  # list of PlantLinearNode.id values


def assign_generations(plants: list[PlantLineageNode]) -> None:
    plant_dict = {plant.id: plant for plant in plants}

    def get_generation(plant_id: int) -> int:
        plant = plant_dict[plant_id]
        # If the generation is already assigned, return it
        if plant.generation is not None:
            return plant.generation
        # Identify root plants
        if plant.parents is None:
            plant.generation = 0
            return 0
        # Plant's generation is one more than the maximum generation of its parents
        plant.generation = max(get_generation(parent_id) for parent_id in plant.parents) + 1
        return plant.generation

    for plant in plants:
        get_generation(plant.id)


def assign_levels_to_generations(plants: list[PlantLineageNode]) -> list[list[PlantLineageNode]]:
    # Throw value error if generation is not assigned
    if any(plant.generation is None for plant in plants):
        raise ValueError("Generation must be assigned to all plants before assigning levels.")

    max_generation = max(plant.generation for plant in plants)
    # Create placeholder list of lists
    levels = [[] for _ in range(max_generation + 1)]
    # Assign each plant to a level based on its generation
    for plant in plants:
        levels[plant.generation].append(plant)
    return levels


@router.get(
    "/user/{user_id}",
    response_model=list[list[PlantLineageNode]],
    response_model_exclude_none=True,
)
async def get_plant_lineage_graph(user_id: str):
    # Construct a graph of plants based on their lineages
    plants = read_all_plants_for_user(user_id)
    plant_nodes = [PlantLineageNode(id=plant.human_id, parents=plant.parent_id) for plant in plants]
    assign_generations(plant_nodes)
    levels = assign_levels_to_generations(plant_nodes)
    # Manually serialize plant nodes to exclude 'generation' and unset 'parents'
    serialized_levels = [
        [plant.model_dump(exclude_none=True, exclude={"generation"}) for plant in level] for level in levels
    ]

    return serialized_levels
