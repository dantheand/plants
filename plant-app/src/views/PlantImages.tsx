import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import React, { useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Button, Card, Image, Modal, Spinner } from "react-bootstrap";
import { NewPlantImage } from "../types/interfaces";
import { SHOW_IMAGES } from "../featureFlags";
import "../styles/styles.css";
import { FaCamera, FaSeedling } from "react-icons/fa";
import ImageUpload from "../components/ImageUpload";
import { FloatingActionButton } from "../components/CommonComponents";

export const PlantImagesLoadingPlaceholder = () => {
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
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<
    NewPlantImage | undefined
  >();
  // State to trigger re-render
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const onUploadSuccess = () => {
    setReloadTrigger((current) => current + 1);
  };

  const handleShowUploadModal = () => {
    if (plant_id) {
      setShowUploadModal(true);
    }
  };
  const handleCloseUploadModal = () => setShowUploadModal(false);

  const handleThumbnailClick = (image: NewPlantImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };
  const handleCloseImageModal = () => setShowImageModal(false);

  const handleDeletePlant = (image: NewPlantImage) => {
    console.log("delete image with id: ", image.image_id);
  };

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
        .then((data) => {
          setPlantImages(data);
          setHasImages(data.length > 0);
        })
        .then(() => {
          setImagesIsLoading(false);
        });
    } else {
      setImagesIsLoading(false);
      setHasImages(false);
    }
  }, [plant_id, reloadTrigger]);

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
          <PlantImagesTimeline3
            plant_images={plantImages}
            onImageClick={handleThumbnailClick}
          />
        ) : (
          <div className="text-center no-images-message">
            <FaSeedling className="no-images-icon" />
            <p>Have a picture of this plant? Upload it!</p>
          </div>
        )}
      </Card.Body>

      {selectedImage && (
        <Modal show={showImageModal} onHide={handleCloseImageModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Full-sized image</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Image
              src={selectedImage.signed_full_photo_url}
              alt="Plant"
              fluid
            />
          </Modal.Body>
          <Modal.Footer className="justify-content-center">
            <Button
              variant="danger"
              onClick={() => handleDeletePlant(selectedImage)}
            >
              Delete Image
            </Button>
          </Modal.Footer>
        </Modal>
      )}
      {plant_id && (
        <Modal show={showUploadModal} onHide={handleCloseUploadModal}>
          <Modal.Header closeButton>
            <Modal.Title>Upload Image</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ImageUpload
              plant_id={plant_id}
              closeModal={handleCloseUploadModal}
              onUploadSuccess={onUploadSuccess}
            />
          </Modal.Body>
        </Modal>
      )}
      <FloatingActionButton
        icon={<FaCamera size="2em" />}
        handleOnClick={handleShowUploadModal}
      />
    </Card>
  );
}

export function PlantImagesTimeline3({
  plant_images,
  onImageClick,
}: {
  plant_images: NewPlantImage[];
  onImageClick: (image: NewPlantImage) => void;
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
              className="img-fluid timelineImage clickable-item"
              onClick={() => onImageClick(plant_image)}
            />
          </div>
        </VerticalTimelineElement>
      ))}
    </VerticalTimeline>
  );
}
