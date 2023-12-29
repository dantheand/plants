import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import React, { useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Card, Image, Modal, Spinner } from "react-bootstrap";
import { NewPlantImage } from "../types/interfaces";
import { SHOW_IMAGES } from "../featureFlags";

export const PlantImagesPlaceholder = () => {
  return (
    <Card className="mb-3">
      <Card.Header as="h4">Images</Card.Header>
      <Card.Body>
        <Spinner />
        Loading images...
      </Card.Body>
    </Card>
  );
};

export function PlantImages({ plant_id }: { plant_id: string | undefined }) {
  const [plantImages, setPlantImages] = useState<NewPlantImage[]>([]);
  const [imagesIsLoading, setImagesIsLoading] = useState<boolean>(true);
  const [hasImages, setHasImages] = useState<boolean>(false);

  //TODO: get the modal working again
  // Modal Stuff
  const [showModal, setShowModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const handleThumbnailClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowModal(true);
  };
  const handleCloseModal = () => setShowModal(false);

  useEffect(() => {
    if (SHOW_IMAGES) {
      fetch(`${BASE_API_URL}/new_images/plants/${plant_id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
        },
      })
        .then((response) => {
          if (!response.ok) {
            if (response.status === 404) {
              return [];
            }
            throw new Error(`Error: ${response.status}`);
          }
          return response.json();
        })
        // TODO: add error handling for no images
        .then((data) => {
          setPlantImages(data);
          setHasImages(data.length > 0);
        })
        .then(() => {
          setImagesIsLoading(false);
        });
    }
  }, [plant_id]);

  return (
    <Card className="mb-3">
      <Card.Header as="h4">Images</Card.Header>
      <Card.Body>
        {imagesIsLoading ? (
          <div>
            <Spinner />
            Loading images...
          </div>
        ) : hasImages ? (
          <PlantImagesTimeline3 plant_images={plantImages} />
        ) : (
          <div className="text-center">
            <p></p>
          </div>
        )}
      </Card.Body>

      <Modal show={showModal} onHide={handleCloseModal} centered>
        <Modal.Header closeButton></Modal.Header>
        <Modal.Body>
          <Image src={selectedImageUrl} alt="Plant" fluid />
        </Modal.Body>
      </Modal>
    </Card>
  );
}

export function PlantImagesTimeline3({
  plant_images,
}: {
  plant_images: NewPlantImage[];
}) {
  // Reorder plants in reverse chronological order
  plant_images.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <VerticalTimeline className="verticalTimeline">
      {plant_images.map((plant_image) => (
        <VerticalTimelineElement
          key={plant_image.timestamp}
          date={new Date(plant_image.timestamp).toLocaleDateString("en-US")}
          className="verticalTimelineElement"
          contentStyle={{ background: "none", boxShadow: "none" }} // Override default styles
          contentArrowStyle={{ borderRight: "none" }} // Override default styles
          iconStyle={{ background: "none", boxShadow: "none" }} // Override default styles
          icon={<i className="fas fa-seedling timelineElementIcon"></i>}
        >
          <div className="timelineElementContent">
            <img
              src={plant_image.signed_thumbnail_photo_url}
              alt={`Plant taken on ${plant_image.timestamp}`}
              className="img-fluid timelineImage"
            />
          </div>
        </VerticalTimelineElement>
      ))}
    </VerticalTimeline>
  );
}
