from plant_api.routers.lineages import (
    PlantLineageNode,
    assign_generations,
    assign_levels_to_generations,
)
from tests.lib import plant_record_factory

from pydantic import TypeAdapter


class TestGenerationAssignment:
    def test_basic_generation_assignment(self):
        # Create a set of related plants
        root_plant = PlantLineageNode(id=0)
        child_plant = PlantLineageNode(id=1, parents=[root_plant.id])
        grandchild_plant = PlantLineageNode(id=2, parents=[child_plant.id])

        assign_generations([root_plant, child_plant, grandchild_plant])
        assert root_plant.generation == 0
        assert child_plant.generation == 1
        assert grandchild_plant.generation == 2

    def test_generation_assignment_with_multiple_roots(self):
        # Create a set of related plants
        root_plant_1 = PlantLineageNode(id=0)
        root_plant_2 = PlantLineageNode(id=1)
        child_plant = PlantLineageNode(id=2, parents=[root_plant_1.id, root_plant_2.id])
        grandchild_plant = PlantLineageNode(id=3, parents=[child_plant.id])

        assign_generations([root_plant_1, root_plant_2, child_plant, grandchild_plant])
        assert root_plant_1.generation == 0
        assert root_plant_2.generation == 0
        assert child_plant.generation == 1
        assert grandchild_plant.generation == 2

    def test_generation_assignment_with_multiple_roots_and_no_children(self):
        # Create a set of related plants
        root_plant_1 = PlantLineageNode(id=0)
        root_plant_2 = PlantLineageNode(id=1)

        assign_generations([root_plant_1, root_plant_2])
        assert root_plant_1.generation == 0
        assert root_plant_2.generation == 0

    def test_generation_assignment_multiple_parents(self):
        # Create a set of related plants
        root_plant = PlantLineageNode(id=0)
        child_plant = PlantLineageNode(id=1, parents=[root_plant.id])
        grandchild_plant = PlantLineageNode(id=2, parents=[child_plant.id, root_plant.id])

        assign_generations([root_plant, child_plant, grandchild_plant])
        assert root_plant.generation == 0
        assert child_plant.generation == 1
        assert grandchild_plant.generation == 2


class TestAssignLevels:
    def test_assign_levels(self):
        plant_1 = PlantLineageNode(id=0, parents=None, generation=0)
        plant_2 = PlantLineageNode(id=1, parents=[0], generation=1)

        result = assign_levels_to_generations([plant_1, plant_2])
        assert len(result) == 2
        assert len(result[0]) == 1
        assert len(result[1]) == 1
        assert result[0][0].id == 0
        assert result[1][0].id == 1


class TestPlantLineages:
    def test_get_basic_lineage(self, mock_db, client_mock_session, default_enabled_user_in_db):
        # Create a set of related plants
        plant_1 = plant_record_factory(parent_id=None)
        plant_2 = plant_record_factory(parent_id=[plant_1.human_id])

        # Add the plants to the mock db
        mock_db.insert_mock_data(plant_1)
        mock_db.insert_mock_data(plant_2)

        response = client_mock_session().get(f"/lineages/user/{default_enabled_user_in_db.google_id}")
        assert response.status_code == 200
        parsed_response = TypeAdapter(list[list[PlantLineageNode]]).validate_python(response.json())
        assert len(parsed_response) == 2
        assert len(parsed_response[0]) == 1
        assert len(parsed_response[1]) == 1
        assert parsed_response[0][0].id == plant_1.human_id
        assert parsed_response[1][0].id == plant_2.human_id
        assert parsed_response[0][0].parents is None
        assert parsed_response[1][0].parents == [plant_1.human_id]
