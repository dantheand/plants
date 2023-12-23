import { PlantLayout } from "./Layouts";
import { PlantForm } from "./PlantDetails";
import { useState } from "react";
import { Plant } from "./schema";
import { v4 as uuidv4 } from "uuid";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "./constants";
import { useNavigate } from "react-router-dom";

export type NewPlant = Partial<Plant>;

const createPlant = async (plant: NewPlant) => {
  const response = await fetch(`${BASE_API_URL}/new_plants`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
    },
    body: JSON.stringify(plant),
  });
  if (!response.ok) {
    alert("Error creating plant");
    return;
  }
  return await response.json();
};

export const initialNewPlantState: NewPlant = {};

export function PlantCreate() {
  const newPlant = initialNewPlantState;
  const [plantInForm, setPlantInForm] = useState<NewPlant>(newPlant);
  const navigate = useNavigate();

  const handleSubmitNewPlant = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    console.log("Submitting new plant:");
    console.log(plantInForm);
    const createdPlant = await createPlant(plantInForm);
    if (!createdPlant) {
      return;
    } else {
      // Navigate to the new plant's page
      navigate(`/plants/${createdPlant.plant_id}`);
    }

    // if successful, redirect to /plants/:plantId
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
