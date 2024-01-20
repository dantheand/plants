import React, { useState } from "react";
import { Button, Card, Form } from "react-bootstrap";
import { NewPlant, Plant } from "../../types/interfaces";
import { FaPencilAlt, FaSave, FaTimes } from "react-icons/fa";
import { EditableInput, NonEditableInputWButtons } from "./EditableInput";
import { deletePlant } from "../../views/PlantDetails";
import { useAlert } from "../../context/Alerts";
import { useNavigate } from "react-router-dom";
import { DeleteButtonWConfirmation } from "../DeleteButtonWConfirmation";
import { HeaderEditSaveButtons } from "./HeaderEditSaveButtons";
import { PlantFormHeader } from "./PlantFormHeader";

interface PlantFormProps {
  plant: NewPlant;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  plantInForm: NewPlant;
  setPlantInForm: React.Dispatch<React.SetStateAction<NewPlant>>;
  isFormEditable: boolean;
  setIsFormEditable: React.Dispatch<React.SetStateAction<boolean>>;
  isFormNewPlant?: boolean;
  nextId?: number;
}

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

  const { showAlert } = useAlert();
  const navigate = useNavigate();

  type PlantField = keyof Plant;
  const handleInputChange =
    (field: PlantField) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlantInForm({ ...plantInForm, [field]: event.target.value });
    };

  const handleDelete = async () => {
    const response = await deletePlant(plant.plant_id);
    if (response.success) {
      showAlert(`Successfully deleted plant ${plant?.human_id}`, "success");
      navigate("/plants");
    } else {
      showAlert(`Error deleting plant: ${response.error}`, "danger");
    }
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
      <Card className="top-level-card">
        <PlantFormHeader
          isFormEditable={isFormEditable}
          toggleEditable={toggleEditable}
          isFormNewPlant={isFormNewPlant}
          buttonsDisabled={false}
        />
        <EditableInput
          label="Unique ID Number"
          type="text"
          value={plantInForm.human_id}
          OnChange={handleInputChange("human_id")}
          isEditable={isFormEditable}
          editsAllowed={false || isFormNewPlant}
          isRequired={true}
          placeholder={"e.g. 1"}
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
        {isFormEditable ? (
          <EditableInput
            label="Plant Parent ID(s)"
            type="text"
            value={plantInForm.parent_id}
            OnChange={handleInputChange("parent_id")}
            isEditable={isFormEditable}
            placeholder={"Specify multiple parents with commas e.g. 1, 2, 3"}
          />
        ) : (
          <NonEditableInputWButtons
            label="Plant Parent ID(s)"
            value={plant.parent_id}
          />
        )}
        {/* TODO make it so you can navigate to parent plants by clicking*/}
        {/*<div*/}
        {/*  onClick={() =>*/}
        {/*    plant.ParentID && handlePlantClick(plant.ParentID, navigate)*/}
        {/*  }*/}
        {/*  className={plant.ParentID ? "clickable-item" : ""}*/}
        {/*>*/}
        {/*  {" "}*/}
        {/*</div>*/}
        <EditableInput
          label="Source"
          type="text"
          value={plantInForm.source}
          OnChange={handleInputChange("source")}
          isEditable={isFormEditable}
          isRequired={true}
          placeholder={"e.g. 'Home Depot', 'Mom', 'Plant"}
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
          placeholder={"e.g. 'Trash', 'Gift to Neighbor'"}
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

        {!isFormNewPlant && (
          <Card.Footer className="mt-2">
            <DeleteButtonWConfirmation
              buttonText="Remove Plant"
              confirmationText={`remove plant`}
              deleteFunction={handleDelete}
            />
          </Card.Footer>
        )}
      </Card>
    </Form>
  );
};
