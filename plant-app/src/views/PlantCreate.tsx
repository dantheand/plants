import { PlantLayout } from "../components/Layouts";
import { useState } from "react";
import { ApiResponse, NewPlant, Plant } from "../types/interfaces";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../context/Alerts";

import { PlantForm } from "../components/plantForm/PlantForm";

const createPlant = async (plant: NewPlant): Promise<ApiResponse<Plant>> => {
  const response = await fetch(`${BASE_API_URL}/plants/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
    },
    body: JSON.stringify(plant),
  });
  if (!response.ok) {
    return {
      success: false,
      data: null,
      error: `Error: ${response.status}`,
    };
  }
  return {
    success: true,
    data: await response.json(),
  };
};

export const initialNewPlantState: NewPlant = {};

export function PlantCreate() {
  const newPlant = initialNewPlantState;
  const [plantInForm, setPlantInForm] = useState<NewPlant>(newPlant);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleSubmitNewPlant = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    console.log("Submitting new plant:");
    console.log(plantInForm);
    const createdPlantResult = await createPlant(plantInForm);
    if (createdPlantResult.success && createdPlantResult.data) {
      showAlert("Successfully created plant", "success");
      // Navigate to the new plant's page
      navigate(`/plants/${createdPlantResult.data.plant_id}`);
    } else {
      showAlert(`Error creating plant: ${createdPlantResult.error}`, "danger");
    }
  };
  return (
    <PlantLayout>
      <PlantForm
        plant={newPlant}
        handleSubmit={handleSubmitNewPlant}
        plantInForm={plantInForm}
        setPlantInForm={setPlantInForm}
        isFormEditable={true}
        setIsFormEditable={() => {}} // no-op function since form should always be editable
        isFormNewPlant={true}
      />
    </PlantLayout>
  );
}
