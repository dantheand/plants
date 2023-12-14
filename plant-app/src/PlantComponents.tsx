import React, { useState, useEffect, JSX } from "react";

import { ListGroup } from "react-bootstrap";

import { BASE_API_URL, JWT_TOKEN_STORAGE } from "./constants";
import { Container, Card, Row, Col, Image, Modal } from "react-bootstrap";

import { useParams, useNavigate, NavigateFunction } from "react-router-dom";
import { BackButton } from "./commonComponents";

import "./timeline.css";
import { Chrono, TimelineItem } from "react-chrono";

interface Plant {
  PlantID: string;
  HumanName: string;
  Species?: string;
  Location: string;
  ParentID?: string;
  Source: string;
  SourceDate: string;
  Sink?: string;
  SinkDate?: string;
  Notes?: string;
}

interface PlantImage {
  ImageID: string;
  Timestamp: string;
  SignedUrl: string;
}

const handlePlantClick = (plantID: string, navigate: NavigateFunction) => {
  navigate(`/plants/${plantID}`);
};

export function PlantList(): JSX.Element {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${BASE_API_URL}/plants/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sortedPlants = data.sort((a: Plant, b: Plant) => {
          return parseInt(a.PlantID) - parseInt(b.PlantID);
        });
        setPlants(sortedPlants);
        setIsLoading(false);
      });
  }, []);

  if (isLoading) {
    return <p>Loading plants...</p>;
  }

  return (
    <div>
      <Container className="p-5 mb-4 bg-light rounded-3">
        <h2>All Plants</h2>
        <ul>
          {plants.map((plant) => (
            <ListGroup>
              <ListGroup.Item
                key={plant.PlantID}
                onClick={() => handlePlantClick(plant.PlantID, navigate)}
                className="clickable-item"
              >
                {plant.PlantID} - {plant.HumanName}
              </ListGroup.Item>
            </ListGroup>
          ))}
        </ul>
      </Container>
    </div>
  );
}

export function PlantDetails() {
  const { plantId } = useParams<{ plantId: string }>();
  const safePlantId = plantId ?? "";
  const navigate = useNavigate();
  // Modal stuff
  const [show, setShow] = useState(false);
  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  // Fetch plant details using plantId or other logic
  const [plant, setPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${BASE_API_URL}/plants/${plantId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setPlant(data);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  }, [plantId]);

  if (isLoading) {
    return <p>Loading plant...</p>;
  }

  if (!plant || error) {
    return <p>Plant not found</p>;
  }

  return (
    <Container className="my-4">
      <BackButton />
      {/* Basic Information Section */}
      <Card className="mb-3">
        <Card.Header as="h4">Basic Information</Card.Header>
        <ListGroup variant="flush">
          <ListGroup.Item>Plant ID: {plant.PlantID || "N/A"}</ListGroup.Item>
          <ListGroup.Item>
            Human Name: {plant.HumanName || "N/A"}
          </ListGroup.Item>
          <ListGroup.Item>Species: {plant.Species || "N/A"}</ListGroup.Item>
          <ListGroup.Item>Location: {plant.Location || "N/A"}</ListGroup.Item>
        </ListGroup>
      </Card>

      {/* Source Information Section */}
      <Card className="mb-3">
        <Card.Header as="h4">Source Information</Card.Header>
        <ListGroup variant="flush">
          <ListGroup.Item
            onClick={() =>
              plant.ParentID && handlePlantClick(plant.ParentID, navigate)
            }
            className={plant.ParentID ? "clickable-item" : ""}
          >
            Parent ID: {plant.ParentID || "N/A"}
          </ListGroup.Item>
          <ListGroup.Item>Source: {plant.Source || "N/A"}</ListGroup.Item>
          <ListGroup.Item>
            Source Date: {plant.SourceDate || "N/A"}
          </ListGroup.Item>
        </ListGroup>
      </Card>

      {/* Sink Information Section */}
      <Card className="mb-3">
        <Card.Header as="h4">Sink Information</Card.Header>
        <ListGroup variant="flush">
          <ListGroup.Item>Sink: {plant.Sink || "N/A"}</ListGroup.Item>
          <ListGroup.Item>Sink Date: {plant.SinkDate || "N/A"}</ListGroup.Item>
        </ListGroup>
      </Card>

      {/* Notes Section */}
      <Card className="mb-3">
        <Card.Header as="h4">Notes</Card.Header>
        <Card.Body>{plant.Notes || "N/A"}</Card.Body>
      </Card>
      {/* Images Section */}
      <PlantImages plant_id={safePlantId} />
    </Container>
  );
}

export function PlantImages({ plant_id }: { plant_id: string }) {
  const [plantImages, setPlantImages] = useState<PlantImage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modal Stuff
  const [showModal, setShowModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState("");
  const handleThumbnailClick = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setShowModal(true);
  };
  const handleCloseModal = () => setShowModal(false);

  useEffect(() => {
    fetch(`${BASE_API_URL}/plants/${plant_id}/images`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setPlantImages(data);
      })
      .then(() => {
        setIsLoading(false);
      });
  }, [plant_id]);

  return (
    <Card className="mb-3">
      <Card.Header as="h4">Images</Card.Header>
      <Card.Body>
        {isLoading ? (
          <div>Loading images...</div>
        ) : (
          <PlantImagesTimeline2
            plant_images={plantImages}
            onThumbnailClick={handleThumbnailClick}
          />
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

// Create a Chronos timeline objects from plant image
// data. This is a React component that can be rendered
// in the PlantDetails component.
export function PlantTimelineObj({
  plant_img,
}: {
  plant_img: PlantImage;
}): TimelineItem {
  return {
    title: plant_img.Timestamp,
    media: {
      type: "IMAGE",
      source: {
        url: plant_img.SignedUrl,
      },
    },
  };
}

// const createImageHTML = ({ plant_img }: { plant_img: PlantImage }) => {
//   return (
//     <div style="width: 100%;">
//       <img
//         src="${plant_img.SignedUrl}"
//         style="object-fit: contain; max-height: 300px; width: 100%;"
//         alt="Plant"
//       />
//       <div>
//         <h5>${plant_img.Timestamp}</h5>
//       </div>
//     </div>
//   );
// };

export function PlantImagesTimeline2({
  plant_images,
  onThumbnailClick,
}: {
  plant_images: PlantImage[];
  onThumbnailClick: (imageUrl: string) => void;
}) {
  return (
    <Chrono
      items={plant_images.map((plant_image) =>
        PlantTimelineObj({ plant_img: plant_image }),
      )}
      mode="VERTICAL_ALTERNATING"
      mediaHeight={500}
      contentDetailsHeight={0}
      hideControls={true}
      theme={{
        primary: "#003366", // Deep Blue (used sparingly)
        secondary: "#FFFFFF", // Soft Green (as a new secondary color for contrast)
        cardBgColor: "#FFFFFF", // White (for a cleaner look, reducing the grey tones)
        cardDetailsBackGround: "#EFEFEF", // Light Grey (subtle and neutral)
        cardDetailsColor: "#424242", // Dark Grey (for readability)
        cardMediaBgColor: "#FFFFFF", // Soft Blue-Grey (less intense than previous blue)
        cardSubtitleColor: "#595959", // Medium Grey (reducing the blue here)
        cardTitleColor: "#212121", // Almost Black (for strong readability)
        detailsColor: "#424242", // Dark Grey (consistent with other text)
        nestedCardBgColor: "#FAFAFA", // Very Light Grey (light and neutral)
        nestedCardDetailsBackGround: "#D1E8E4", // Very Pale Green (a hint of color)
        nestedCardDetailsColor: "#424242", // Dark Grey (for readability)
        nestedCardSubtitleColor: "#FF6F61", // Coral (a pop of color)
        nestedCardTitleColor: "#4F4F4F", // Darker Grey (less blue than before)
        iconBackgroundColor: "#B0C4DE", // Light Steel Blue (soft and less saturated)
        titleColorActive: "#4F4F4F", // Coral (for an active and noticeable look)
        titleColor: "#4F4F4F", // Darker Grey (more neutral than blue)
      }}
    ></Chrono>
  );
}

export function PlantImagesTimeline({
  plant_images,
  onThumbnailClick,
}: {
  plant_images: PlantImage[];
  onThumbnailClick: (imageUrl: string) => void;
}) {
  return (
    <Container>
      {plant_images.map((image, index) => (
        <Row
          key={image.ImageID}
          className={
            index % 2 === 0
              ? "timeline-row"
              : "timeline-row timeline-row-alternate"
          }
        >
          <Col md={6} className="timeline-date">
            <p>{image.Timestamp}</p>
          </Col>
          <Col md={6} className="timeline-image-col">
            <Image
              src={image.SignedUrl}
              alt={`Plant taken on ${image.Timestamp}`}
              fluid
              rounded
              className="timeline-img clickable-item"
              onClick={() => onThumbnailClick(image.SignedUrl)}
            />
          </Col>
        </Row>
      ))}
    </Container>
  );
}

export function PlantImagesOriginal({
  plant_images,
}: {
  plant_images: PlantImage[];
}) {
  return (
    <Container>
      <Row>
        {plant_images.map((plant_image) => (
          <Col key={plant_image.Timestamp} sm={12} md={6} lg={4} xl={3}>
            <PlantImageContainer plant_image={plant_image} />
          </Col>
        ))}
      </Row>
    </Container>
  );
}

export function PlantImageContainer({
  plant_image,
}: {
  plant_image: PlantImage;
}) {
  return (
    <Container>
      <Card>
        <h5 className="text-center">{plant_image.Timestamp}</h5>
        <Card.Img
          variant="top"
          src={plant_image.SignedUrl}
          className="img-fluid"
          alt="Plant"
        />
      </Card>
    </Container>
  );
}

// function PlantModalonClick({image, show}: {image: PlantImage, show: boolean}){
//     <Modal show={show} onHide={handleClose}>
//         <Modal.Header closeButton>
//           <Modal.Title>Modal heading</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>Woohoo, you are reading this text in a modal!</Modal.Body>
//       </Modal>
//
// }
