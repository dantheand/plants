import React, { useState } from "react";
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
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({});

  // We keep track of if an image has been loaded so we can selectively remove the lazy load attribute
  //    and prevent flickering when navigating back to the grid view.
  const handleImageLoad = (plantId: string) => {
    setLoadedImages((prevLoadedImages) => ({
      ...prevLoadedImages,
      [plantId]: true,
    }));
  };

  return (
    <Row xs={2} md={3} lg={4} xl={5} className="g-4">
      {isLoading || !plants ? (
        <Spinner />
      ) : (
        plants.map((plant) => (
          <Col key={plant.plant_id}>
            <Card
              key={plant.plant_id}
              className="m-1 clickable-item card-hoverable"
              onClick={() => handlePlantClick(plant.plant_id, navigate)}
            >
              {plantGridIsLoading || !plantImages[plant.plant_id] ? (
                // Render placeholder image if still loading
                <Card.Img
                  src={loadingImagePlaceholder}
                  alt="Loading..."
                  className="custom-card-img"
                />
              ) : (
                // Render actual image if loading is complete
                <Card.Img
                  onLoad={() => handleImageLoad(plant.plant_id)}
                  loading={!loadedImages[plant.plant_id] ? "lazy" : undefined}
                  src={plantImages[plant.plant_id] || noimagePlaceholder}
                  alt="Plant image"
                  className="custom-card-img"
                />
              )}
              <Card.ImgOverlay>
                <div className="card-top-content">
                  <Card.Title className={"image-card-title"}>
                    {plant.human_name}
                  </Card.Title>
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
