import React from "react";
import { Plant } from "../../types/interfaces";
import { Card, Col, Row, Spinner } from "react-bootstrap";
import noimagePlaceholder from "../../assets/200x200_image_placeholder.png";
import loadingImagePlaceholder from "../../assets/200x200_loading_image.png";
import { NavigateFunction } from "react-router-dom";
import { usePlants } from "../../context/Plants";

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
  const { plantGridIsLoading, plantImages } = usePlants();

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
              className="m-1 clickable-item card-hoverable"
              onClick={() => handlePlantClick(plant.plant_id, navigate)}
            >
              {plantGridIsLoading ? (
                // Render placeholder image if still loading
                <Card.Img
                  src={loadingImagePlaceholder}
                  alt="Loading..."
                  className="custom-card-img"
                />
              ) : (
                // Render actual image if loading is complete
                <Card.Img
                  loading="lazy"
                  src={plantImages[plant.plant_id] || noimagePlaceholder}
                  alt="Plant image"
                  className="custom-card-img"
                />
              )}
              <Card.ImgOverlay>
                <div className="card-top-content">
                  <Card.Title>{plant.human_name}</Card.Title>
                </div>
                <div className="card-bottom-content">{plant.human_id}</div>
              </Card.ImgOverlay>
            </Card>
          </Col>
        ))
      )}
    </Row>
  );
}
