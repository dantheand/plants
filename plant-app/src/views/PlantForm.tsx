// Define props for EditableInput component
import React, { useState } from "react";
import { NewPlant, Plant } from "../types/interfaces";
import { Button, Card, Col, Form, Placeholder, Row } from "react-bootstrap";
import { FaPencilAlt, FaSave, FaTimes } from "react-icons/fa";

interface EditableInputProps {
  label: string;
  type: string;
  value: string | number | string[] | undefined;
  editsAllowed?: boolean;
  OnChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isEditable: boolean;
  isRequired?: boolean;
}

const EditableInput = ({
  label,
  type,
  value,
  editsAllowed = true,
  OnChange,
  isEditable,
  isRequired = false,
}: EditableInputProps) => {
  return (
    <Form.Group as={Row} className="m-2">
      <Form.Label column md={3}>
        {label} {isRequired && <span className="required-asterisk">*</span>}
      </Form.Label>
      <Col md={9}>
        <Form.Control
          required={isRequired}
          type={type}
          value={value}
          onChange={OnChange}
          disabled={!(isEditable && editsAllowed)}
        />
      </Col>
    </Form.Group>
  );
};

interface PlantFormProps {
  plant: NewPlant;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  plantInForm: NewPlant;
  setPlantInForm: React.Dispatch<React.SetStateAction<NewPlant>>;
  isFormEditable: boolean;
  setIsFormEditable: React.Dispatch<React.SetStateAction<boolean>>;
  isFormNewPlant?: boolean;
}

// TODO: make the placeholder and form share more components
export const PlantFormPlaceholder = () => {
  return (
    <Card className="mb-3">
      <Card.Header as="h4">Plant Information</Card.Header>
      <Card.Body>
        {[...Array(8)].map((_, idx) => (
          <Placeholder key={idx} as="p" animation="glow">
            <Placeholder xs={12} />
          </Placeholder>
        ))}
      </Card.Body>
    </Card>
  );
};

export const PlantForm = ({
  plant,
  handleSubmit,
  plantInForm,
  setPlantInForm,
  isFormEditable,
  setIsFormEditable,
  isFormNewPlant = false,
}: PlantFormProps) => {
  const [plantBeforeEdit, setPlantBeforeEdit] = useState<NewPlant>(plant);

  type PlantField = keyof Plant;
  const handleInputChange =
    (field: PlantField) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlantInForm({ ...plantInForm, [field]: event.target.value });
    };

  const toggleEditable = () => {
    if (isFormEditable) {
      setPlantInForm(plantBeforeEdit);
    } else {
      setPlantBeforeEdit(plantInForm);
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
        {/*<EditableInput*/}
        {/*  label="UUID"*/}
        {/*  type="text"*/}
        {/*  value={plantInForm.plant_id}*/}
        {/*  OnChange={handleInputChange("plant_id")}*/}
        {/*  isEditable={isFormEditable}*/}
        {/*  editsAllowed={false}*/}
        {/*/>*/}
        <EditableInput
          label="ID Number"
          type="text"
          value={plantInForm.human_id}
          OnChange={handleInputChange("human_id")}
          isEditable={isFormEditable}
          editsAllowed={false || isFormNewPlant}
          isRequired={true}
        />
        <EditableInput
          label="Plant Name"
          type="text"
          value={plantInForm.human_name}
          OnChange={handleInputChange("human_name")}
          isEditable={isFormEditable}
          isRequired={true}
        />
        <EditableInput
          label="Species"
          type="text"
          value={plantInForm.species}
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
          label="Plant Parent ID(s)"
          type="text"
          value={plantInForm.parent_id}
          OnChange={handleInputChange("parent_id")}
          isEditable={isFormEditable}
        />
        <EditableInput
          label="Source"
          type="text"
          value={plantInForm.source}
          OnChange={handleInputChange("source")}
          isEditable={isFormEditable}
          isRequired={true}
        />
        <EditableInput
          label={"Source Date"}
          type={"date"}
          value={plantInForm.source_date}
          OnChange={handleInputChange("source_date")}
          isEditable={isFormEditable}
          isRequired={true}
        />

        <EditableInput
          label={"Sink"}
          type={"text"}
          value={plantInForm.sink}
          OnChange={handleInputChange("sink")}
          isEditable={isFormEditable}
        />
        <EditableInput
          label={"Sink Date"}
          type={"date"}
          value={plantInForm.sink_date}
          OnChange={handleInputChange("sink_date")}
          isEditable={isFormEditable}
        />

        <EditableInput
          label={"Notes"}
          type={"textarea"}
          value={plantInForm.notes}
          OnChange={handleInputChange("notes")}
          isEditable={isFormEditable}
        />
      </Card>
    </Form>
  );
};
