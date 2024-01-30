import React, { useEffect, useState } from "react";
import { Plant, PlantImage } from "../../types/interfaces";
import { Card, Col, Row, Spinner } from "react-bootstrap";
import noimagePlaceholder from "../../assets/200x200_image_placeholder.png";
import loadingImagePlaceholder from "../../assets/200x200_loading_image.png";
import { NavigateFunction } from "react-router-dom";
import { useApi } from "../../utils/api";
import { useAlert } from "../../context/Alerts";
import { BASE_API_URL } from "../../constants";

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
  const [plantGridIsLoading, setPlantGridIsLoading] = useState<boolean>(false);
  const [plantImages, setPlantImages] = useState<Record<string, string>>({});
  const { callApi } = useApi();
  const { showAlert } = useAlert();

  // TODO: make it cancel this (or any API call) if navigating away
  useEffect(() => {
    // Check if image data for all plants already exists
    if (!plants || plants.length === 0) {
      return; // No need to fetch data
    }
    setPlantGridIsLoading(true);
    const plantIds = plants.map((plant) => plant.plant_id);
    console.log(plantIds);
    callApi(BASE_API_URL + "/images/plants/most_recent/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(plantIds),
    }).then(async (response) => {
      console.log(response);
      if (!response.ok) {
        showAlert("Error loading plant images", "danger");
        return;
      }
      const imageData = await response.json();
      const imageMap: Record<string, string> = {};
      plantIds.forEach((id) => {
        const foundImage = imageData.find(
          (img: PlantImage) => img.plant_id === id,
        );
        imageMap[id] = foundImage
          ? foundImage.signed_thumbnail_photo_url
          : noimagePlaceholder;
      });
      setPlantImages(imageMap);
      setPlantGridIsLoading(false);
      showAlert("Loaded plant images", "success");
    });
  }, [plants, callApi, showAlert]);

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