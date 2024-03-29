import React, { createContext, useState, useContext, useEffect } from "react";
import { BASE_API_URL } from "../constants";
import { ApiResponse, NewPlant, Plant, PlantImage } from "../types/interfaces";
import { useAlert } from "./Alerts";
import { useApi } from "../utils/api";
import noimagePlaceholder from "../assets/200x200_image_placeholder.png";
import { useAuth } from "./Auth";
import { SHOW_IMAGES } from "../featureFlags";
import { NavigateFunction } from "react-router-dom";

interface CreatePlantProps {
  plant: NewPlant;
}

interface PlantContextType {
  plants: Plant[];
  isLoading: boolean;
  createPlant: (props: CreatePlantProps) => Promise<ApiResponse<Plant>>;
  nextPlantId: number;
  forceReloadPlants: () => void;
  plantImages: Record<string, string>;
  plantGridIsLoading: boolean;
  navigateWithQueryID: (
    queryID: string,
    navigate: NavigateFunction,
  ) => Promise<void>;
  lastQueryID: string | null;
  fetchPlants: (queryID: string | null, forced?: boolean) => Promise<void>;
}

export const PlantContext = createContext<PlantContextType>(
  {} as PlantContextType,
);

export const usePlants = () => useContext(PlantContext);

function incrementLargestId(plants: Plant[]): number {
  if (plants.length === 0) {
    return 1; // Return 1 if there are no plants, assuming IDs start from 1
  }

  const maxHumanId = plants.reduce((maxId, plant) => {
    return plant.human_id > maxId ? plant.human_id : maxId;
  }, plants[0].human_id);

  return maxHumanId + 1;
}

interface CreatePlantProps {
  callApi: (url: string, options?: RequestInit) => Promise<Response>;
  plant: NewPlant;
}

interface PlantProviderProps {
  children: React.ReactNode;
}
export const PlantProvider: React.FC<PlantProviderProps> = ({ children }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextPlantId, setNextPlantId] = useState(1);
  const [lastQueryID, setLastQueryID] = useState<string | null>(null);

  const [plantGridIsLoading, setPlantGridIsLoading] = useState<boolean>(false);
  const [plantImages, setPlantImages] = useState<Record<string, string>>({});

  const { userId } = useAuth();

  const { showAlert } = useAlert();
  const { callApi } = useApi();
  const { isAuthenticated } = useAuth();

  const navigateWithQueryID = async (
    queryID: string | null,
    navigate: NavigateFunction,
  ) => {
    if (queryID === "me" || queryID === null) {
      queryID = userId;
    }
    // Check if the queryID is different from the lastQueryID before fetching new data
    if (queryID !== lastQueryID) {
      setIsLoading(true);
      setPlants([]);

      await fetchPlants(queryID);
    } else {
      setIsLoading(false);
    }

    // Perform navigation
    navigate(`/plants/user/${queryID}`);
  };

  const fetchPlants = async (
    queryID: string | null,
    forced: boolean = false,
  ) => {
    if (!forced) {
      if (queryID === lastQueryID || !queryID) {
        return;
      }
    }
    setLastQueryID(queryID);

    setIsLoading(true);
    callApi(`${BASE_API_URL}/plants/user/${queryID}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        const sortedPlants = data.sort((a: Plant, b: Plant) => {
          return a.human_id - b.human_id;
        });
        setNextPlantId(incrementLargestId(sortedPlants));
        setPlants(sortedPlants);
        setIsLoading(false);
      })
      .catch((error) => {
        showAlert(`Error fetching plant list: ${error}`, "danger");
        console.error("Error fetching plant list:", error);
        setIsLoading(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Fetch plant thumbnails for the grid whenever plants change
  useEffect(() => {
    if (SHOW_IMAGES) {
      // Prevents API error on logout
      if (!isAuthenticated) {
        return;
      }
      // No need to fetch images if there are no plants
      if (!plants || plants.length === 0) {
        return;
      }
      setPlantGridIsLoading(true);
      const plantIds = plants.map((plant) => plant.plant_id);
      callApi(BASE_API_URL + "/images/plants/most_recent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(plantIds),
      }).then(async (response) => {
        console.log(response);
        if (!response.ok) {
          showAlert("Error loading plant images", "danger");
          return;
        }
        const imageData = await response.json();
        const imageMap: Record<string, string> = {};
        plantIds.forEach((id) => {
          const foundImage = imageData.find(
            (img: PlantImage) => img.plant_id === id,
          );
          imageMap[id] = foundImage
            ? foundImage.signed_thumbnail_photo_url
            : noimagePlaceholder;
        });
        setPlantImages(imageMap);
        setPlantGridIsLoading(false);
      });
    }
  }, [plants, callApi, showAlert, isAuthenticated]);

  // TODO: convert this to force reload YOUR plants (this is an edge case where someone CRUDs a plant after visiting
  //    another users plant list
  const forceReloadPlants = async () => {
    if (!lastQueryID) {
      return;
    }
    fetchPlants(lastQueryID, true);
  };

  // TODO: centralize all the plant create, update, delete methods here
  const createPlant = async ({
    plant,
  }: CreatePlantProps): Promise<ApiResponse<Plant>> => {
    const response = await callApi(`${BASE_API_URL}/plants/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(plant),
    });
    if (!response.ok) {
      const error_response = await response.json();
      const error_message = JSON.stringify(error_response);
      return {
        success: false,
        data: null,
        error: `Error: ${error_message}`,
      };
    }
    return {
      success: true,
      data: await response.json(),
    };
  };

  return (
    <PlantContext.Provider
      value={{
        plants,
        isLoading,
        createPlant,
        nextPlantId,
        forceReloadPlants,
        plantImages,
        plantGridIsLoading,
        navigateWithQueryID,
        lastQueryID,
        fetchPlants,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
};
