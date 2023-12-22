import React, { useEffect, useState } from "react";
import "react-vertical-timeline-component/style.min.css";
import "./PlantImagesTimeline.css";

import { Button, Card, Col, Container, Form, Row } from "react-bootstrap";

import { BASE_API_URL, HARDCODED_USER, JWT_TOKEN_STORAGE } from "./constants";

import { useNavigate, useParams } from "react-router-dom";
import { BackButton } from "./commonComponents";
import { FaPencilAlt, FaSave, FaTimes } from "react-icons/fa";
import { PlantImages } from "./PlantImages";
import { Plant } from "./schema";

// Define props for EditableInput component
interface EditableInputProps {
  label: string;
  type: string;
  value: string | number | string[] | undefined;
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

interface PlantFormProps {
  plant: Plant;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

const PlantForm = ({ plant, handleSubmit }: PlantFormProps) => {
  const [isFormEditable, setIsFormEditable] = useState<boolean>(false);
  const [originalPlant, setOriginalPlant] = useState<Plant>(plant);
  const [plantInForm, setPlantInForm] = useState<Plant>(plant);

  type PlantField = keyof Plant;
  const handleInputChange =
    (field: PlantField) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlantInForm({ ...plantInForm, [field]: event.target.value });
    };

  const toggleEditable = () => {
    if (isFormEditable) {
      setPlantInForm(originalPlant);
    } else {
      setOriginalPlant(plantInForm);
    }
    setIsFormEditable(!isFormEditable);
  };
  return (
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
            <Button variant="primary" type="submit" disabled={!isFormEditable}>
              <FaSave />
            </Button>
          </div>
        </Card.Header>
        <EditableInput
          label="UUID"
          type="text"
          value={plantInForm.plant_id}
          OnChange={handleInputChange("plant_id")}
          isEditable={isFormEditable}
          editsAllowed={false}
        />
        <EditableInput
          label="Human ID"
          type="text"
          value={plantInForm.human_id}
          OnChange={handleInputChange("human_id")}
          isEditable={isFormEditable}
          editsAllowed={false}
        />
        <EditableInput
          label="Human Name"
          type="text"
          value={plantInForm.human_name}
          OnChange={handleInputChange("human_name")}
          isEditable={isFormEditable}
        />
        <EditableInput
          label="Species"
          type="text"
          value={plantInForm.species || ""}
          OnChange={handleInputChange("species")}
          isEditable={isFormEditable}
        />
        <EditableInput
          label="Location"
          type="text"
          value={plantInForm.location}
          OnChange={handleInputChange("location")}
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
          value={plantInForm.parent_id || ""}
          OnChange={handleInputChange("parent_id")}
          isEditable={isFormEditable}
        />
        <EditableInput
          label="Source"
          type="text"
          value={plantInForm.source || ""}
          OnChange={handleInputChange("source")}
          isEditable={isFormEditable}
        />
        <EditableInput
          label={"Source Date"}
          type={"date"}
          value={plantInForm.source_date ?? ""}
          OnChange={handleInputChange("source_date")}
          isEditable={isFormEditable}
        />

        <EditableInput
          label={"Sink"}
          type={"text"}
          value={plantInForm.sink ?? ""}
          OnChange={handleInputChange("sink")}
          isEditable={isFormEditable}
        />
        <EditableInput
          label={"Sink Date"}
          type={"date"}
          value={plantInForm.sink_date ?? ""}
          OnChange={handleInputChange("sink_date")}
          isEditable={isFormEditable}
        />

        <EditableInput
          label={"Notes"}
          type={"textarea"}
          value={plantInForm.notes ?? ""}
          OnChange={handleInputChange("notes")}
          isEditable={isFormEditable}
        />
      </Card>
    </Form>
  );
};

const usePlantDetails = (plantId: string | undefined) => {
  const [plant, setPlant] = useState<Plant | null>(null);
  const [plantIsLoading, setPlantIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`${BASE_API_URL}/new_plants/${plantId}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        setPlant(data);
        setPlantIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setPlantIsLoading(false);
      });
  }, [plantId]);
  return { plant, plantIsLoading, error, setPlant };
};

export function PlantDetails() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();

  const { plant, plantIsLoading, error, setPlant } = usePlantDetails(plantId);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: PATCH to API and setPlant to return
    alert("Form submitted!");
  };

  if (plantIsLoading) {
    return <p>Loading plant...</p>;
  }

  if (!plant || error) {
    return <p>Plant not found</p>;
  }

  return (
    <Container className="my-4">
      <BackButton />
      <PlantForm plant={plant} handleSubmit={handleSubmit} />
      {/* Images Section */}
      <PlantImages human_id={plant.human_id} />
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
