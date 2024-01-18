import { ListGroup, Placeholder } from "react-bootstrap";
import React from "react";
import { Plant } from "../../types/interfaces";
import { NavigateFunction } from "react-router-dom";

interface RenderListItemsProps {
  isLoading: boolean;
  plants?: Plant[];
  handlePlantClick: (plantID: string, navigate: NavigateFunction) => void;
  navigate: NavigateFunction;
}

export const PlantListTable = ({
  isLoading,
  plants,
  handlePlantClick,
  navigate,
}: RenderListItemsProps) => {
  return (
    <ListGroup className="mx-3 my-3">
      {isLoading || !plants
        ? [...Array(10)].map((_, idx) => (
            <Placeholder as={ListGroup.Item} animation="glow" key={idx}>
              <Placeholder xs={12} size="lg" />
            </Placeholder>
          ))
        : plants.map((plant) => (
            <ListGroup.Item
              key={plant.plant_id}
              action
              onClick={() => handlePlantClick(plant.plant_id, navigate)}
              className="d-flex justify-content-start"
            >
              <div className="me-auto">{plant.human_id}</div>
              <div className={"me-auto mx-3"}>{plant.human_name}</div>
            </ListGroup.Item>
          ))}
    </ListGroup>
  );
};
