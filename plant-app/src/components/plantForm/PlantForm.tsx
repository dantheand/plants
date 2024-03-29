import React, { useState } from "react";
import { Card, Form } from "react-bootstrap";
import { NewPlant, Plant } from "../../types/interfaces";
import { EditableInput } from "./EditableInput";
import { deletePlant } from "../../views/PlantDetails";
import { useAlert } from "../../context/Alerts";
import { useNavigate } from "react-router-dom";
import { DeleteButtonWConfirmation } from "../DeleteButtonWConfirmation";
import { PlantFormHeader } from "./PlantFormHeader";
import { ParentIdInput } from "./ParentIdInput";
import { useApi } from "../../utils/api";
import { usePlants } from "../../context/Plants";

interface PlantFormProps {
  plant: NewPlant;
  handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  plantInForm: NewPlant;
  setPlantInForm: React.Dispatch<React.SetStateAction<NewPlant>>;
  isFormEditable: boolean;
  setIsFormEditable: React.Dispatch<React.SetStateAction<boolean>>;
  isFormNewPlant?: boolean;
  nextId?: number;
  setPlantIsLoading?: React.Dispatch<React.SetStateAction<boolean>>;
  isYourPlant: boolean;
}

export const PlantForm = ({
  plant,
  handleSubmit,
  plantInForm,
  setPlantInForm,
  isFormEditable,
  setIsFormEditable,
  isFormNewPlant = false,
  setPlantIsLoading,
  isYourPlant,
}: PlantFormProps) => {
  const [plantBeforeEdit, setPlantBeforeEdit] = useState<NewPlant>(plant);

  const { showAlert } = useAlert();
  const navigate = useNavigate();
  const { callApi } = useApi();
  const { forceReloadPlants } = usePlants();

  type PlantField = keyof Plant;
  const handleInputChange =
    (field: PlantField) => (event: React.ChangeEvent<HTMLInputElement>) => {
      setPlantInForm({ ...plantInForm, [field]: event.target.value });
    };

  const handleDelete = async () => {
    const response = await deletePlant(callApi, plant.plant_id);
    if (response.success) {
      showAlert(`Successfully deleted plant ${plant?.human_id}`, "success");
      forceReloadPlants();
      navigate("/plants/user/me");
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
          isYourPlant={isYourPlant}
        />
        <Card.Body>
          <EditableInput
            label="Unique ID Number"
            type="text"
            value={plantInForm.human_id}
            OnChange={handleInputChange("human_id")}
            isEditable={isFormEditable}
            // This is redundant, but keeping it for clarity
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
              label="Parent Plant ID(s)"
              type="text"
              value={plantInForm.parent_id}
              OnChange={handleInputChange("parent_id")}
              isEditable={isFormEditable}
              placeholder={"e.g. 1, 2, 3"}
            />
          ) : (
            <ParentIdInput
              label="Parent Plant ID(s)"
              value={plant.parent_id}
              plant={plant}
              setPlantIsLoading={setPlantIsLoading}
            />
          )}
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
          {isFormNewPlant && (
            <div
              className={"m-4 p-2 text-center bg-light border rounded w-auto"}
            >
              Save plant to upload images.
            </div>
          )}
        </Card.Body>
        {!isFormNewPlant && isYourPlant && (
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
