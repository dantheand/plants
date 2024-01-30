import React, { createContext, useState, useContext } from "react";
import { BASE_API_URL } from "../constants";
import { Plant } from "../types/interfaces";
import { useAlert } from "./Alerts";
import { useApi } from "../utils/api";

interface PlantContextType {
  plants: Plant[];
  isLoading: boolean;
  fetchPlants: (queryID: string) => Promise<void>;
  nextPlantId: number;
  forceReloadPlants: () => void;
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
  const { showAlert } = useAlert();
  const { callApi } = useApi();

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

  // TODO: convert this to force reload YOUR plants
  const forceReloadPlants = async () => {
    fetchPlants(lastQueryID || "", true);
  };

  // TODO: centralize all the plant create, update, delete methods here

  // TODO: also add in method to fetch the PlantGrid images

  return (
    <PlantContext.Provider
      value={{ plants, isLoading, fetchPlants, nextPlantId, forceReloadPlants }}
    >
      {children}
    </PlantContext.Provider>
  );
};
