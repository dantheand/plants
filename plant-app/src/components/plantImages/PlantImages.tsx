import React, { useEffect, useState } from "react";
import { BASE_API_URL } from "../../constants";
import { Card } from "react-bootstrap";
import { PlantImage } from "../../types/interfaces";
import { SHOW_IMAGES } from "../../featureFlags";
import "../../styles/styles.scss";
import { FaCamera } from "react-icons/fa";
import { useAlert } from "../../context/Alerts";
import { NoImagesPlaceholder } from "./NoImagesPlaceholder";
import { ImageDisplayModal } from "./ImageDisplayModal";
import { ImageDeletionConfirmationModal } from "./ImageDeletionConfirmationModal";
import { PlantImagesTimeline } from "./PlantImagesTimeline";
import { PlantImagesLoadingPlaceholder } from "./PlantImagesLoadingPlaceholder";
import { ImageUploadModal } from "./ImageUploadModal";
import { FloatingActionButton } from "../FloatingActionButton";
import { useApi } from "../../utils/api";

const deletePlantImage = async (
  callApi: (url: string, options?: RequestInit) => Promise<Response>,
  image: PlantImage,
) => {
  return callApi(`${BASE_API_URL}/images/${image.image_id}`, {
    method: "DELETE",
  });
};

const getPlantImages = async (
  callApi: (url: string, options?: RequestInit) => Promise<Response>,
  plant_id: string | undefined,
) => {
  return callApi(`${BASE_API_URL}/images/plants/${plant_id}`);
};

export function PlantImages({
  plant_id,
  isYourPlant,
}: {
  plant_id: string | undefined;
  isYourPlant: boolean;
}) {
  const { showAlert } = useAlert();
  const { callApi } = useApi();
  const [plantImages, setPlantImages] = useState<PlantImage[]>([]);
  const [imagesIsLoading, setImagesIsLoading] = useState<boolean>(true);
  const [hasImages, setHasImages] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showConfirmDeleteModal, setShowConfirmDeleteModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState<PlantImage | undefined>();
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

  const handleThumbnailClick = (image: PlantImage) => {
    setSelectedImage(image);
    setShowImageModal(true);
  };
  const handleCloseImageModal = () => setShowImageModal(false);

  const handleDeleteClick = (image: PlantImage) => {
    setSelectedImage(image);
    setShowConfirmDeleteModal(true);
  };
  const confirmDeleteImage = (image: PlantImage) => {
    deletePlantImage(callApi, image)
      .then((response) => {
        if (!response.ok) {
          showAlert("Error deleting image.", "danger");
          return;
        }
        console.log("deleted image");
        showAlert("Successfuly deleted image!", "success");
        handleCloseImageModal();
        setShowConfirmDeleteModal(false);
        setReloadTrigger((current) => current + 1);
      })
      .catch((error) => {
        console.error("Error deleting image:", error);
        showAlert("Network error deleting image.", "danger");
      });
  };

  useEffect(() => {
    if (SHOW_IMAGES) {
      callApi(`${BASE_API_URL}/images/plants/${plant_id}`)
        .then((response) => {
          if (!response.ok) {
            if (response.status === 404) {
              return [];
            }
          }
          return response.json();
        })
        .then((data) => {
          setPlantImages(data);
          setHasImages(data.length > 0);
        })
        .catch((error) => {
          console.error("Error fetching plant images:", error);
          showAlert(`Error fetching plant images: ${error}`, "danger");
        })
        .finally(() => {
          setImagesIsLoading(false);
        });
    } else {
      setImagesIsLoading(false);
      setHasImages(false);
    }
  }, [plant_id, reloadTrigger, callApi]);

  return (
    <Card className="top-level-card">
      <Card.Header as="h4">Images</Card.Header>
      <Card.Body>
        {imagesIsLoading ? (
          <PlantImagesLoadingPlaceholder />
        ) : hasImages ? (
          <PlantImagesTimeline
            plant_images={plantImages}
            onImageClick={handleThumbnailClick}
          />
        ) : (
          <NoImagesPlaceholder />
        )}
      </Card.Body>

      {selectedImage && (
        <ImageDisplayModal
          show={showImageModal}
          onHide={handleCloseImageModal}
          image={selectedImage}
          onDelete={handleDeleteClick}
          isYourPlant={isYourPlant}
        />
      )}
      {selectedImage && showConfirmDeleteModal && (
        <ImageDeletionConfirmationModal
          show={showConfirmDeleteModal}
          onHide={() => setShowConfirmDeleteModal(false)}
          onConfirm={confirmDeleteImage}
          image={selectedImage}
        />
      )}
      {plant_id && (
        <ImageUploadModal
          show={showUploadModal}
          onHide={handleCloseUploadModal}
          plant_id={plant_id}
          onUploadSuccess={onUploadSuccess}
        />
      )}
      {isYourPlant && (
        <FloatingActionButton
          icon={<FaCamera size="2em" />}
          handleOnClick={handleShowUploadModal}
        />
      )}
    </Card>
  );
}
