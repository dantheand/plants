import React, { createContext, useState, useContext, useEffect } from "react";
import { BASE_API_URL } from "../constants";
import { Plant, PlantImage } from "../types/interfaces";
import { useAlert } from "./Alerts";
import { useApi } from "../utils/api";
import noimagePlaceholder from "../assets/200x200_image_placeholder.png";
import { useAuth } from "./Auth";

interface PlantContextType {
  plants: Plant[];
  isLoading: boolean;
  fetchPlants: (queryID: string) => Promise<void>;
  nextPlantId: number;
  forceReloadPlants: () => void;
  plantImages: Record<string, string>;
  plantGridIsLoading: boolean;
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

  return maxHumanId + 1; // Increment after finding the max
}

interface PlantProviderProps {
  children: React.ReactNode;
}
export const PlantProvider: React.FC<PlantProviderProps> = ({ children }) => {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextPlantId, setNextPlantId] = useState(0);
  const [lastQueryID, setLastQueryID] = useState<string | null>(null);

  const [plantGridIsLoading, setPlantGridIsLoading] = useState<boolean>(false);
  const [plantImages, setPlantImages] = useState<Record<string, string>>({});

  const { showAlert } = useAlert();
  const { callApi } = useApi();
  const { isAuthenticated } = useAuth();

  // Method to fetch plants from API
  const fetchPlants = async (queryID: string, forced: boolean = false) => {
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

  // Fetch plant thumbnails for the grid
  useEffect(() => {
    // Prevents API error on logout
    if (!isAuthenticated) {
      return;
    }
    // Check if image data for all plants already exists
    if (!plants || plants.length === 0) {
      return; // No need to fetch data
    }
    setPlantGridIsLoading(true);
    const plantIds = plants.map((plant) => plant.plant_id);
    console.log(plantIds);
    callApi(BASE_API_URL + "/images/plants/most_recent/", {
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
  }, [plants, callApi, showAlert, isAuthenticated]);

  // TODO: convert this to force reload YOUR plants
  const forceReloadPlants = async () => {
    if (!lastQueryID) {
      return;
    }
    fetchPlants(lastQueryID, true);
  };

  // TODO: centralize all the plant create, update, delete methods here

  return (
    <PlantContext.Provider
      value={{
        plants,
        isLoading,
        fetchPlants,
        nextPlantId,
        forceReloadPlants,
        plantImages,
        plantGridIsLoading,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
};
