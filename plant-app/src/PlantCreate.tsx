import { PlantLayout } from "./Layouts";
import { PlantForm } from "./PlantDetails";
import { useState } from "react";
import { Plant } from "./schema";

export type NewPlant = Partial<Plant>;
export const initialNewPlantState: NewPlant = {};

export function PlantCreate() {
  const newPlant = initialNewPlantState;
  const [plantInForm, setPlantInForm] = useState<NewPlant>(newPlant);

  const handleSubmitNewPlant = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    console.log("Submitting new plant:");
    console.log(plantInForm);
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
