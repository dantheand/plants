import logging
from collections import defaultdict
from typing import Optional

from plant_api.routers.common import BaseRouter
from plant_api.dependencies import get_current_user_session
from pydantic import BaseModel

from fastapi import Depends

from plant_api.routers.plants import read_all_plants_for_user
from plant_api.schema import PlantItem

logger = logging.getLogger(__name__)


router = BaseRouter(
    prefix="/lineages",
    dependencies=[Depends(get_current_user_session)],
    responses={404: {"description": "Not found"}},
)


class PlantLineageNode(BaseModel):
    id: int | str  # this is the human_id or a source/sink name
    source: str = None
    sink: Optional[str] = None
    generation: Optional[int] = None
    parents: Optional[list[int | str]] = None  # list of PlantLinearNode.id values


def create_nodes_for_sources(plants: list[PlantItem]) -> list[PlantLineageNode]:
    source_ids = []
    for plant in plants:
        # If the plant has no parent_id, then extract its source name to create a new node
        if plant.parent_id is None:
            source_ids.append(plant.source)
    # Dedeplicate sources and create a new plant node for each source
    source_ids = set(source_ids)
    return [PlantLineageNode(id=source_id) for source_id in source_ids]


def create_nodes_for_sinks(plants: list[PlantItem]) -> list[PlantLineageNode]:
    """Creates a new node for each sink in the list of plants and assigns parents as all plants who sunk into it"""
    sinks = defaultdict(list)

    for plant in plants:
        if plant.sink is not None:
            sinks[plant.sink].append(plant.human_id)
    return [PlantLineageNode(id=sink, parents=sinks[sink]) for sink in sinks]


def assign_generations_and_source_parents(plants: list[PlantLineageNode]) -> None:
    plant_dict = {plant.id: plant for plant in plants}

    def get_generation(plant_id: int) -> Optional[int]:
        plant = plant_dict[plant_id]
        # If the generation is already assigned, return it
        if plant.generation is not None:
            return plant.generation
        # Place sources at the root
        if plant.source is None and plant.parents is None:
            plant.generation = 0
            return 0
        # If the plant has no parents, but has a source, then its a first generation plant
        if plant.parents is None:
            # Also reassign its parent to be the source
            plant.parents = [plant.source]
            plant.generation = 1
            return 1
        # If the plant id is a string, then it's a sink and should wait to have its generation in a later step
        if isinstance(plant.id, str):
            return None
        # Plant's generation is one more than the maximum generation of its parents
        plant.generation = max(get_generation(parent_id) for parent_id in plant.parents) + 1
        return plant.generation

    for plant in plants:
        get_generation(plant.id)

    # Assign sink generation to be one more than the maximum generation all plants
    max_generation = max(plant.generation for plant in plants if plant.generation)
    for plant in plants:
        if plant.generation is None:
            plant.generation = max_generation + 1


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

    # Sort by id within each level if the ID is a number, otherwise sort by name
    for level in levels:
        level.sort(key=lambda plant: (isinstance(plant.id, int), plant.id))

    return levels


@router.get(
    "/user/{user_id}",
    response_model=list[list[PlantLineageNode]],
    response_model_exclude_none=True,
)
async def get_plant_lineage_graph(user_id: str):
    # Construct a graph of plants based on their lineages
    plants = read_all_plants_for_user(user_id)
    plant_nodes = [
        PlantLineageNode(id=plant.human_id, source=plant.source, parents=plant.parent_id) for plant in plants
    ]
    source_nodes = create_nodes_for_sources(plants)
    sink_nodes = create_nodes_for_sinks(plants)
    all_plant_nodes = plant_nodes + source_nodes + sink_nodes
    assign_generations_and_source_parents(all_plant_nodes)
    levels = assign_levels_to_generations(all_plant_nodes)
    # Only include id and parents since that's what the plotting code expects
    serialized_levels = [
        [plant.model_dump(exclude_none=True, include={"id", "parents"}) for plant in level] for level in levels
    ]

    return serialized_levels
