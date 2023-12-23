import { PlantLayout } from "./Layouts";
import { PlantForm } from "./PlantDetails";
import { useState } from "react";
import { Plant } from "./schema";
import { v4 as uuidv4 } from "uuid";

export type NewPlant = Partial<Plant>;

export const initialNewPlantState: NewPlant = { plant_id: uuidv4() };

export function PlantCreate() {
  const newPlant = initialNewPlantState;
  const [plantInForm, setPlantInForm] = useState<NewPlant>(newPlant);

  const handleSubmitNewPlant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Submitting new plant:");
    console.log(plantInForm);
    // POST to /new_plants

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
