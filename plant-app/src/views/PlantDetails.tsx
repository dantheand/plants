import React, { useEffect, useState } from "react";
import "react-vertical-timeline-component/style.min.css";
import "../styles/plantImagesTimeline.css";

import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";

import { useNavigate, useParams } from "react-router-dom";
import { ApiResponse, NewPlant, Plant } from "../types/interfaces";
import { PlantLayout } from "../components/Layouts";
import { DeleteButtonWConfirmation } from "../components/CommonComponents";
import { useAlert } from "../context/Alerts";
import "../styles/styles.css";
import { PlantForm, PlantFormPlaceholder } from "./PlantForm";
import { PlantImages, PlantImagesPlaceholder } from "./PlantImages";
import { initialNewPlantState } from "./PlantCreate";

const updatePlant = async (
  plantData: NewPlant,
): Promise<ApiResponse<Plant>> => {
  try {
    const response = await fetch(
      `${BASE_API_URL}/new_plants/${plantData.plant_id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
        },
        body: JSON.stringify(plantData),
      },
    );
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `Error: ${response.status}`,
      };
    }

    return { success: true, data: await response.json() };
  } catch (error) {
    console.error("Error updating plant:", error);
    return {
      success: false,
      data: null,
      error: "Unknown error",
    };
  }
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

const deletePlant = async (
  plantId: string | undefined,
): Promise<ApiResponse<null>> => {
  if (!plantId) {
    return {
      success: false,
      data: null,
      error: "No plant ID provided",
    };
  }
  try {
    // Perform the DELETE request
    const response = await fetch(`${BASE_API_URL}/new_plants/${plantId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    });
    if (!response.ok) {
      return {
        success: false,
        data: null,
        error: `Error: ${response.status}`,
      };
    }
    // Handle successful deletion
    return {
      success: true,
      data: null,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error deleting plant:", message);
    return {
      success: false,
      data: null,
      error: "Unknown error" || message,
    };
  }
};

export function PlantDetails() {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const [plantInForm, setPlantInForm] =
    useState<NewPlant>(initialNewPlantState);
  const { plant, plantIsLoading, error, setPlant } = usePlantDetails(plantId);
  const [isFormEditable, setIsFormEditable] = useState<boolean>(false);
  const { showAlert } = useAlert();

  useEffect(() => {
    if (plant) {
      setPlantInForm(plant);
    }
  }, [plant]);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plantInForm) {
      console.error("No plant data to submit");
      return;
    }
    console.log("Submitting form");
    console.log(plantInForm);
    const updatedPlantResult = await updatePlant(plantInForm);
    if (updatedPlantResult.success) {
      setPlant(updatedPlantResult.data);
      setIsFormEditable(false);
      showAlert("Successfully updated plant", "success");
    } else {
      if (!plant) {
        setPlantInForm(initialNewPlantState);
      } else {
        setPlantInForm(plant);
      }
      setIsFormEditable(false);
      showAlert("Failed to update plant", "danger");
    }
  };

  const handleDelete = async () => {
    const response = await deletePlant(plantId);
    if (response.success) {
      showAlert(`Successfully deleted plant ${plant?.human_id}`, "success");
      navigate("/plants");
    } else {
      showAlert(`Error deleting plant: ${response.error}`, "danger");
    }
  };

  if (plantIsLoading || !plantInForm) {
    return (
      <PlantLayout>
        <PlantFormPlaceholder />
        <PlantImagesPlaceholder />
      </PlantLayout>
    );
  }

  if (!plant || error) {
    return <p>Plant not found</p>;
  }

  return (
    <PlantLayout>
      <DeleteButtonWConfirmation
        entityName="Plant"
        confirmationText={`delete ${plant.human_id}`}
        deleteFunction={handleDelete}
      />
      <PlantForm
        plant={plant}
        handleSubmit={handleSubmit}
        plantInForm={plantInForm}
        setPlantInForm={setPlantInForm}
        isFormEditable={isFormEditable}
        setIsFormEditable={setIsFormEditable}
      />
      <PlantImages plant_id={plantId} />
    </PlantLayout>
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
