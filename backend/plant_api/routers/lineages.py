import logging
from collections import Counter, defaultdict
from datetime import date
from typing import Optional, Sequence
from uuid import UUID

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
    node_name: str = "fake_name"
    plant_id: Optional[str] = None

    source: Optional[str] = None
    source_date: Optional[date] = None
    sink: Optional[str] = None
    # Graph building properties
    generation: int = -1  # -1 is placeholder generation value
    parents: Optional[Sequence[int | str]] = None


def create_nodes_for_sources(plants: list[PlantItem]) -> list[PlantLineageNode]:
    """Creates a new node for each (non-plant)  source in the list of plants"""
    source_ids = []
    for plant in plants:
        # If the plant has no parent_id, then extract its source name to create a new node
        if plant.parent_id is None:
            source_ids.append(plant.source)
    # Dedeplicate sources and create a new plant node for each source
    source_ids = list(set(source_ids))
    return [PlantLineageNode(id=source_id, node_name=source_id) for source_id in source_ids]


def create_nodes_for_sinks(plants: list[PlantItem]) -> list[PlantLineageNode]:
    """Creates a new node for each sink in the list of plants

    For each sink, it assigns all plants that sunk to it as parents
    """
    sinks = defaultdict(list)

    for plant in plants:
        if plant.sink is not None:
            sinks[plant.sink].append(plant.human_id)
    return [PlantLineageNode(id=sink, node_name=sink, parents=sinks[sink]) for sink in sinks]


def create_nodes_for_plants(plants: list[PlantItem]) -> list[PlantLineageNode]:
    """Creates a new node for each plant in the list of plants"""
    return [
        PlantLineageNode(
            id=plant.human_id,
            plant_id=plant.plant_id,
            node_name=plant.human_name,
            source=plant.source,
            source_date=plant.source_date,
            parents=plant.parent_id,
        )
        for plant in plants
    ]


def assign_generations_and_source_parents(nodes: list[PlantLineageNode]) -> None:
    """Creates generations from a list of node nodes.

    Generations are grouping of plants based on the hierarchy of their parents.

    We set the generation of source nodes to be 0 and set the generation of sink nodes to be one more than the maximum
    generation of all plants.
    """
    node_dict = {node.id: node for node in nodes}

    def get_generation(node_id: int | str) -> int:
        node = node_dict[node_id]
        # If the generation is already assigned, return it
        if node.generation != -1:
            return node.generation
        # If the node has no source or parents, then it's a source and has generation 0
        if node.source is None and node.parents is None:
            node.generation = 0
            return 0
        # If the node has no parents, but has a source, then its a first generation plant node
        if node.parents is None and node.source is not None:
            # Also reassign its parent to be the source
            node.parents = [node.source]
            node.generation = 1
            return 1
        # If the id is a string, then it's a sink node and we put a placeholder generation and assign it in a later step
        if isinstance(node.id, str):
            node.generation = -1
            return -1
        # Node's generation is one more than the maximum generation of its parents
        if node.parents is not None:
            node.generation = max(get_generation(parent_id) for parent_id in node.parents) + 1
            return node.generation
        return -1

    for node in nodes:
        get_generation(node.id)

    # Assign sink generation to be one more than the maximum generation all plants
    max_generation = max(node.generation for node in nodes if node.generation != -1)
    for node in nodes:
        if node.generation == -1:
            node.generation = max_generation + 1


def get_parent_counts(nodes: list[PlantLineageNode]) -> dict:
    """Returns a dictionary mapping parent IDs to the count of their occurrences as a parent."""
    all_parents = [parent for node in nodes for parent in (node.parents or [])]
    return Counter(all_parents)


def assign_levels_to_generations(plants: list[PlantLineageNode]) -> list[list[PlantLineageNode]]:
    """Groups plants into levels based on their generation"""

    for plant in plants:
        if plant.generation is None:
            raise ValueError("Generation must be assigned to all plants before assigning levels.")

    max_generation = max(plant.generation for plant in plants)
    # Create placeholder list of lists
    levels: list = [[] for _ in range(max_generation + 1)]
    # Assign each plant to a level based on its generation
    for plant in plants:
        levels[plant.generation].append(plant)

    # Sort within levels
    parent_counts = get_parent_counts(plants)
    for level in levels:
        level.sort(
            key=lambda node: (
                # Primary sort key: Negative count of plants per parent_id to have larger groups first
                parent_counts[min(node.parents)] if node.parents else 0,
                # Secondary sort key: Parent_id (min for plants with multiple parents)
                min(node.parents) if node.parents else "0",
                # Tertiary sort key: Plant's own id
                node.id,
            )
        )

    return levels


@router.get(
    "/user/{user_id}",
    response_model=list[list[PlantLineageNode]],
    # Exclude none to prevent empty parents
    response_model_exclude_none=True,
)
async def get_plant_lineage_graph(user_id: str):
    # Construct a graph of plants based on their lineages
    plants = read_all_plants_for_user(user_id)
    plant_nodes = create_nodes_for_plants(plants)
    source_nodes = create_nodes_for_sources(plants)
    sink_nodes = create_nodes_for_sinks(plants)

    all_plant_nodes = plant_nodes + source_nodes + sink_nodes
    assign_generations_and_source_parents(all_plant_nodes)
    levels = assign_levels_to_generations(all_plant_nodes)

    return levels
