from plant_api.routers.lineages import (
    PlantLineageNode,
    assign_generations_and_source_parents,
    assign_levels_to_generations,
)
from tests.lib import plant_record_factory

from pydantic import TypeAdapter


class TestGenerationAssignment:
    def test_basic_generation_assignment(self):
        # Create a set of related plants
        source = PlantLineageNode(id="source", node_type="source")
        root_plant = PlantLineageNode(id=0, parents=[source.id], node_type="plant")
        child_plant = PlantLineageNode(id=1, parents=[root_plant.id], node_type="plant")
        grandchild_plant = PlantLineageNode(id=2, parents=[child_plant.id], node_type="plant")

        assign_generations_and_source_parents([source, root_plant, child_plant, grandchild_plant])
        assert source.generation == 0
        assert root_plant.generation == 1
        assert child_plant.generation == 2
        assert grandchild_plant.generation == 3

    def test_generation_assignment_with_multiple_roots(self):
        # Create a set of related plants
        root_plant_1 = PlantLineageNode(id=0, node_type="plant")
        root_plant_2 = PlantLineageNode(id=1, node_type="plant")
        child_plant = PlantLineageNode(id=2, parents=[root_plant_1.id, root_plant_2.id], node_type="plant")
        grandchild_plant = PlantLineageNode(id=3, parents=[child_plant.id], node_type="plant")

        assign_generations_and_source_parents([root_plant_1, root_plant_2, child_plant, grandchild_plant])
        assert root_plant_1.generation == 0
        assert root_plant_2.generation == 0
        assert child_plant.generation == 1
        assert grandchild_plant.generation == 2

    def test_generation_assignment_with_multiple_roots_and_no_children(self):
        # Create a set of related plants
        source = PlantLineageNode(id="source", node_type="source")
        root_plant_1 = PlantLineageNode(id=0, parents=[source.id], node_type="plant")
        root_plant_2 = PlantLineageNode(id=1, parents=[source.id], node_type="plant")

        assign_generations_and_source_parents([source, root_plant_1, root_plant_2])
        assert source.generation == 0
        assert root_plant_1.generation == 1
        assert root_plant_2.generation == 1

    def test_generation_assignment_multiple_parents(self):
        # Create a set of related plants
        root_plant = PlantLineageNode(id=0, node_type="plant")
        child_plant = PlantLineageNode(id=1, parents=[root_plant.id], node_type="plant")
        grandchild_plant = PlantLineageNode(id=2, parents=[child_plant.id, root_plant.id], node_type="plant")

        assign_generations_and_source_parents([root_plant, child_plant, grandchild_plant])
        assert root_plant.generation == 0
        assert child_plant.generation == 1
        assert grandchild_plant.generation == 2

    def test_generation_assignment_w_sink(self):
        # Create a set of related plants
        root_plant = PlantLineageNode(id=0, node_type="plant")
        child_plant = PlantLineageNode(id=1, parents=[root_plant.id], node_type="plant")
        sink = PlantLineageNode(id="sink", parents=[child_plant.id], node_type="sink")

        assign_generations_and_source_parents([root_plant, child_plant, sink])
        assert root_plant.generation == 0
        assert child_plant.generation == 1
        assert sink.generation == 2


class TestAssignLevels:
    def test_assign_levels(self):
        plant_1 = PlantLineageNode(id=0, parents=None, generation=0, node_type="source")
        plant_2 = PlantLineageNode(id=1, parents=[0], generation=1, node_type="plant")

        result = assign_levels_to_generations([plant_1, plant_2])
        assert len(result) == 2
        assert len(result[0]) == 1
        assert len(result[1]) == 1
        assert result[0][0].id == 0
        assert result[1][0].id == 1


class TestPlantLineages:
    def test_get_basic_lineage(self, mock_db, client_mock_session, default_enabled_user_in_db):
        # Create a set of related plants
        root_plant = plant_record_factory(parent_id=None, source="source", sink=None, sink_date=None)
        child_plant = plant_record_factory(parent_id=[root_plant.human_id], sink="sink", sink_date="2021-01-01")

        # Add the plants to the mock db
        mock_db.insert_mock_data(root_plant)
        mock_db.insert_mock_data(child_plant)

        response = client_mock_session().get(f"/lineages/user/{default_enabled_user_in_db.google_id}")
        assert response.status_code == 200
        parsed_response = TypeAdapter(list[list[PlantLineageNode]]).validate_python(response.json())
        print(parsed_response)
        assert len(parsed_response) == 3
        for level in parsed_response:
            assert len(level) == 1
        assert parsed_response[0][0].id == root_plant.source
        assert parsed_response[1][0].id == root_plant.human_id
        assert parsed_response[2][0].id == child_plant.human_id
        assert parsed_response[0][0].parents is None
        assert parsed_response[1][0].parents == [root_plant.source]
        assert parsed_response[2][0].parents == [root_plant.human_id]
