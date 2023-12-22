import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import React, { useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "./constants";
import { Card, Image, Modal, Spinner } from "react-bootstrap";
import { PlantImage } from "./schema";

// TODO: switch this over to using the plant_id UUID value (need to switch over the API)
export function PlantImages({ human_id }: { human_id: number }) {
  const [plantImages, setPlantImages] = useState<PlantImage[]>([]);
  const [imagesIsLoading, setImagesIsLoading] = useState<boolean>(true);

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
    // TODO: only fetch if the plant_id has been loaded
    fetch(`${BASE_API_URL}/images/${human_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setPlantImages(data);
      })
      .then(() => {
        setImagesIsLoading(false);
      });
  }, [human_id]);

  return (
    <Card className="mb-3">
      <Card.Header as="h4">Images</Card.Header>
      <Card.Body>
        {imagesIsLoading ? (
          <div>
            <Spinner />
            Loading images...
          </div>
        ) : (
          <PlantImagesTimeline3 plant_images={plantImages} />
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
  plant_images: PlantImage[];
}) {
  return (
    <VerticalTimeline className="verticalTimeline">
      {plant_images.map((plant_image) => (
        <VerticalTimelineElement
          key={plant_image.Timestamp}
          date={new Date(plant_image.Timestamp).toLocaleDateString("en-US")}
          className="verticalTimelineElement"
          contentStyle={{ background: "none", boxShadow: "none" }} // Override default styles
          contentArrowStyle={{ borderRight: "none" }} // Override default styles
          iconStyle={{ background: "none", boxShadow: "none" }} // Override default styles
          icon={<i className="fas fa-seedling timelineElementIcon"></i>}
        >
          <div className="timelineElementContent">
            <img
              src={plant_image.SignedUrl}
              alt={`Plant taken on ${plant_image.Timestamp}`}
              className="img-fluid timelineImage"
            />
          </div>
        </VerticalTimelineElement>
      ))}
    </VerticalTimeline>
  );
}
