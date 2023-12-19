import React, { useEffect, useState } from "react";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";
import "./PlantImagesTimeline.css";

import {
  Button,
  Card,
  Col,
  Container,
  Form,
  Image,
  Modal,
  Row,
  Spinner,
} from "react-bootstrap";

import { BASE_API_URL, JWT_TOKEN_STORAGE } from "./constants";

import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "./commonComponents";
import { FaPencilAlt, FaSave, FaTimes } from "react-icons/fa";

export interface Plant {
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

// Define props for EditableInput component
interface EditableInputProps {
  label: string;
  type: string;
  value: string;
  editsAllowed?: boolean;
  OnChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isEditable: boolean;
}

const EditableInput = ({
  label,
  type,
  value,
  editsAllowed = true,
  OnChange,
  isEditable,
}: EditableInputProps) => {
  return (
    <Form.Group as={Row} className="m-2">
      <Form.Label column sm={2}>
        {label}
      </Form.Label>
      <Col sm={10}>
        <Form.Control
          type={type}
          value={value}
          onChange={OnChange}
          disabled={!(isEditable && editsAllowed)}
          // plaintext={!editsAllowed}
        />
      </Col>
    </Form.Group>
  );
};

export function PlantDetails() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();

  // Fetch plant details using plantId or other logic
  const [plant, setPlant] = useState<Plant>({
    PlantID: "",
    HumanName: "",
    Species: "",
    Location: "",
    ParentID: "",
    Source: "",
    SourceDate: "",
    Sink: "",
    SinkDate: "",
    Notes: "",
  });
  const [originalPlant, setOriginalPlant] = useState<Plant>({
    PlantID: "",
    HumanName: "",
    Species: "",
    Location: "",
    ParentID: "",
    Source: "",
    SourceDate: "",
    Sink: "",
    SinkDate: "",
    Notes: "",
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormEditable, setIsFormEditable] = useState<boolean>(false);

  useEffect(() => {
    fetch(`${BASE_API_URL}/plants/${plantId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setPlant(data);
        setOriginalPlant(data);
        setIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  }, [plantId]);

  type PlantField = keyof Plant;
  const handleInputChange =
    (field: PlantField) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlant({ ...plant, [field]: event.target.value });
    };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    alert("Form submitted!");
  };

  const toggleEditable = () => {
    if (isFormEditable) {
      setPlant(originalPlant);
    } else {
      setOriginalPlant(plant);
    }
    setIsFormEditable(!isFormEditable);
  };

  if (isLoading) {
    return <p>Loading plant...</p>;
  }

  if (!plant || error) {
    return <p>Plant not found</p>;
  }

  return (
    <Container className="my-4">
      <BackButton />
      <Form onSubmit={handleSubmit}>
        <Card className="mb-3">
          <Card.Header
            as="h4"
            className="d-flex justify-content-between align-items-center"
          >
            <span>Plant Information</span>
            <div>
              <Button
                variant={isFormEditable ? "danger" : "secondary"}
                onClick={toggleEditable}
                className="mx-2"
              >
                {isFormEditable ? <FaTimes /> : <FaPencilAlt />}
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={!isFormEditable}
              >
                <FaSave />
              </Button>
            </div>
          </Card.Header>
          <EditableInput
            label="Plant ID"
            type="text"
            value={plant.PlantID}
            OnChange={handleInputChange("PlantID")}
            isEditable={isFormEditable}
            editsAllowed={false}
          />
          <EditableInput
            label="Human Name"
            type="text"
            value={plant.HumanName}
            OnChange={handleInputChange("HumanName")}
            isEditable={isFormEditable}
          />
          <EditableInput
            label="Species"
            type="text"
            value={plant.Species || ""}
            OnChange={handleInputChange("Species")}
            isEditable={isFormEditable}
          />
          <EditableInput
            label="Location"
            type="text"
            value={plant.Location}
            OnChange={handleInputChange("Location")}
            isEditable={isFormEditable}
          />

          {/*<div*/}
          {/*  onClick={() =>*/}
          {/*    plant.ParentID && handlePlantClick(plant.ParentID, navigate)*/}
          {/*  }*/}
          {/*  className={plant.ParentID ? "clickable-item" : ""}*/}
          {/*>*/}
          {/*  {" "}*/}
          {/*</div>*/}
          <EditableInput
            label="Parent ID"
            type="text"
            value={plant.ParentID || ""}
            OnChange={handleInputChange("Species")}
            isEditable={isFormEditable}
          />
          <EditableInput
            label="Source"
            type="text"
            value={plant.Source || ""}
            OnChange={handleInputChange("Source")}
            isEditable={isFormEditable}
          />
          <EditableInput
            label={"Source Date"}
            type={"date"}
            value={plant.SourceDate}
            OnChange={handleInputChange("SourceDate")}
            isEditable={isFormEditable}
          />

          <EditableInput
            label={"Sink"}
            type={"text"}
            value={plant.Sink ?? ""}
            OnChange={handleInputChange("Sink")}
            isEditable={isFormEditable}
          />
          <EditableInput
            label={"Sink Date"}
            type={"date"}
            value={plant.SinkDate ?? ""}
            OnChange={handleInputChange("SinkDate")}
            isEditable={isFormEditable}
          />

          <EditableInput
            label={"Notes"}
            type={"textarea"}
            value={plant.Notes ?? ""}
            OnChange={handleInputChange("Notes")}
            isEditable={isFormEditable}
          />
        </Card>
      </Form>
      {/* Images Section */}
      <PlantImages plant_id={plantId ?? ""} />
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

// function PlantModalonClick({image, show}: {image: PlantImage, show: boolean}){
//     <Modal show={show} onHide={handleClose}>
//         <Modal.Header closeButton>
//           <Modal.Title>Modal heading</Modal.Title>
//         </Modal.Header>
//         <Modal.Body>Woohoo, you are reading this text in a modal!</Modal.Body>
//       </Modal>
//
// }
