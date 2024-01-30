import { BaseLayout } from "../components/Layouts";
import { useState } from "react";
import { NewPlant } from "../types/interfaces";
import { useNavigate, useParams } from "react-router-dom";
import { useAlert } from "../context/Alerts";

import { PlantForm } from "../components/plantForm/PlantForm";
import { useApi } from "../utils/api";
import { usePlants } from "../context/Plants";

export const initialNewPlantState: NewPlant = {};

export function PlantCreate() {
  const { nextId } = useParams<{ nextId: string }>();
  let newPlant = initialNewPlantState;
  if (nextId) {
    newPlant = { ...newPlant, human_id: parseInt(nextId) };
  }
  const [plantInForm, setPlantInForm] = useState<NewPlant>(newPlant);
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { callApi } = useApi();
  const { forceReloadPlants, createPlant } = usePlants();

  // TODO: move this into the Plants provider
  const handleSubmitNewPlant = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    console.log("Submitting new plant:");
    console.log(plantInForm);
    const createdPlantResult = await createPlant({
      callApi: callApi,
      plant: plantInForm,
    });
    if (createdPlantResult.success && createdPlantResult.data) {
      showAlert("Successfully created plant", "success");
      // Navigate to the new plant's page
      navigate(`/plants/${createdPlantResult.data.plant_id}`);
      forceReloadPlants();
    } else {
      showAlert(`Error creating plant: ${createdPlantResult.error}`, "danger");
    }
  };
  return (
    <BaseLayout>
      <PlantForm
        plant={newPlant}
        handleSubmit={handleSubmitNewPlant}
        plantInForm={plantInForm}
        setPlantInForm={setPlantInForm}
        isFormEditable={true}
        setIsFormEditable={() => {}} // no-op function since form should always be editable
        isFormNewPlant={true}
        isYourPlant={true}
      />
    </BaseLayout>
  );
}
