import React from "react";
import { Plant } from "../../types/interfaces";
import {
  Card,
  Col,
  ListGroup,
  Placeholder,
  Row,
  Spinner,
} from "react-bootstrap";
import { NavigateFunction } from "react-router-dom";

interface PlantGridProps {
  isLoading: boolean;
  plants?: Plant[];
  handlePlantClick: (plantID: string, navigate: NavigateFunction) => void;
  navigate: NavigateFunction;
}

export function PlantGrid({
  isLoading,
  plants,
  handlePlantClick,
  navigate,
}: PlantGridProps) {
  return (
    <Row xs={2} md={3} lg={4} className="g-4">
      {isLoading || !plants ? (
        // TODO: make this placeholder look like cards
        <Spinner />
      ) : (
        plants.map((plant) => (
          <Col key={plant.plant_id}>
            <Card
              key={plant.plant_id}
              className="m-1 clickable-item"
              style={{ width: "10rem" }}
              onClick={() => handlePlantClick(plant.plant_id, navigate)}
            >
              <Card.Img src="https://placehold.co/200x200" alt="Card image" />
              <Card.ImgOverlay>
                <Card.Title>{plant.human_name}</Card.Title>
                <Card.Text>{plant.source}</Card.Text>
              </Card.ImgOverlay>
            </Card>
          </Col>
        ))
      )}
    </Row>
  );
}
