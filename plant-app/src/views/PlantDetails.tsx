import React, { useEffect, useState } from "react";
import "react-vertical-timeline-component/style.min.css";
import "../styles/plantImagesTimeline.scss";

import { BASE_API_URL } from "../constants";

import { useNavigate, useParams } from "react-router-dom";
import { ApiResponse, NewPlant, Plant } from "../types/interfaces";
import { BaseLayout } from "../components/Layouts";
import { useAlert } from "../context/Alerts";
import "../styles/styles.scss";
import { PlantImages } from "../components/plantImages/PlantImages";
import { initialNewPlantState } from "./PlantCreate";
import { Card } from "react-bootstrap";
import { PlantImagesLoadingPlaceholder } from "../components/plantImages/PlantImagesLoadingPlaceholder";
import { PlantForm } from "../components/plantForm/PlantForm";
import { PlantFormPlaceholder } from "../components/plantForm/PlantFormPlaceholder";
import { useAuth } from "../context/Auth";
import { useApi } from "../utils/api";
import { usePlants } from "../context/Plants";

// TODO: move this into the Plants provider
const updatePlant = async (
  callApi: (url: string, options?: RequestInit) => Promise<Response>,
  plantData: NewPlant,
): Promise<ApiResponse<Plant>> => {
  try {
    const response = await callApi(
      `${BASE_API_URL}/plants/${plantData.plant_id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
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
  const { callApi } = useApi();

  useEffect(() => {
    callApi(`${BASE_API_URL}/plants/${plantId}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setPlant(data);
        setPlantIsLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setPlantIsLoading(false);
      });
  }, [plantId, callApi]);
  return { plant, plantIsLoading, error, setPlant, setPlantIsLoading };
};

// TODO: move this into the Plants provider
export const deletePlant = async (
  callApi: (url: string, options?: RequestInit) => Promise<Response>,
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
    const response = await callApi(`${BASE_API_URL}/plants/${plantId}`, {
      method: "DELETE",
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
  const { plant, plantIsLoading, error, setPlant, setPlantIsLoading } =
    usePlantDetails(plantId);
  const [isFormEditable, setIsFormEditable] = useState<boolean>(false);
  const { showAlert } = useAlert();
  const { userId } = useAuth();
  const [isYourPlant, setIsYourPlant] = useState<boolean | null>(null);
  const { callApi } = useApi();
  const { forceReloadPlants } = usePlants();

  useEffect(() => {
    if (!plant || !userId) {
      return;
    }
    if (plant.user_id !== userId) {
      setIsYourPlant(false);
    }
    if (plant.user_id === userId) {
      setIsYourPlant(true);
    }
  }, [plant, userId]);

  useEffect(() => {
    if (error) {
      console.log("error", error);
      showAlert(`Error fetching plant: ${error}`, "danger");
      navigate("/plants/user/me");
    }
    if (plant) {
      setPlantInForm(plant);
    }
  }, [plant, error, navigate, showAlert]);
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!plantInForm) {
      console.error("No plant data to submit");
      return;
    }
    console.log("Submitting form");
    console.log(plantInForm);
    const updatedPlantResult = await updatePlant(callApi, plantInForm);
    if (updatedPlantResult.success) {
      setPlant(updatedPlantResult.data);
      setIsFormEditable(false);
      forceReloadPlants();
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

  if (plantIsLoading || !plantInForm) {
    return (
      <BaseLayout>
        <PlantFormPlaceholder />
        <Card className="top-level-card">
          <Card.Header as="h4">Observations</Card.Header>
          <Card.Body>
            <PlantImagesLoadingPlaceholder />
          </Card.Body>
        </Card>
      </BaseLayout>
    );
  }

  if (!plant || error) {
    return <p>Plant not found</p>;
  }

  return (
    <BaseLayout>
      {isYourPlant !== null ? (
        <PlantForm
          plant={plant}
          handleSubmit={handleSubmit}
          plantInForm={plantInForm}
          setPlantInForm={setPlantInForm}
          isFormEditable={isFormEditable}
          setIsFormEditable={setIsFormEditable}
          setPlantIsLoading={setPlantIsLoading}
          isYourPlant={isYourPlant}
        />
      ) : (
        // Loading state or null state until isYourPlant is determined
        <PlantFormPlaceholder />
      )}
      <PlantImages plant_id={plantId} isYourPlant={isYourPlant} />
    </BaseLayout>
  );
}
