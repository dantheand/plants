import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE, USE_GRID_VIEW } from "../constants";
import { Button, Card } from "react-bootstrap";

import { Plant } from "../types/interfaces";
import { FaPlus, FaList, FaTh } from "react-icons/fa";

import "../styles/styles.scss";
import { PlantListTable } from "../components/plantList/PlantListTable";
import { PlantGrid } from "../components/plantList/PlantGrid";
import { BaseLayout } from "../components/Layouts";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { useAlert } from "../context/Alerts";
import { useAuth } from "../context/Auth";
import { useApi } from "../utils/api";
import useLocalStorageState from "use-local-storage-state";

function incrementLargestId(plants: Plant[]): number {
  if (plants.length === 0) {
    return 1; // Return 1 if there are no plants, assuming IDs start from 1
  }

  const maxHumanId = plants.reduce((maxId, plant) => {
    return plant.human_id > maxId ? plant.human_id : maxId;
  }, plants[0].human_id);

  return maxHumanId + 1; // Increment after finding the max
}

const handlePlantClick = (plantID: string, navigate: NavigateFunction) => {
  navigate(`/plants/${plantID}`);
};

export function PlantList(): JSX.Element {
  const params = useParams<string>();
  const pathSpecifiedId = params.userId;
  const [isYourPlants, setIsYourPlants] = useState<boolean>(true);
  const [queryID, setQueryID] = useState<string | undefined>(undefined);
  // TODO: make a global state for this
  const [isGridView, setIsGridView] = useLocalStorageState<boolean>(
    USE_GRID_VIEW,
    {
      defaultValue: false,
    },
  );

  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nextPlantId, setNextPlantId] = useState<number>(0);
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { callApi } = useApi();
  const { userId } = useAuth();

  // Set query ID based on URL path or user ID
  useEffect(() => {
    if (
      pathSpecifiedId === "me" ||
      pathSpecifiedId === undefined ||
      pathSpecifiedId === userId
    ) {
      setIsYourPlants(true);
      setQueryID(userId);
    } else {
      setIsYourPlants(false);
      setQueryID(pathSpecifiedId);
    }
  }, [pathSpecifiedId, userId]);

  // Fetch plants from API
  useEffect(() => {
    // Don't fetch if the query user ID has not been set yet
    if (!queryID) {
      return;
    }
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
  }, [queryID, showAlert, callApi]);

  return (
    <BaseLayout>
      <Card className="top-level-card">
        <Card.Header
          as="h4"
          className={"d-flex justify-content-between align-items-center"}
        >
          {isYourPlants ? "Your Plants" : "Your Friend's Plants"}
          <Button
            variant="secondary"
            className="float-right"
            onClick={() => setIsGridView(!isGridView)}
          >
            {isGridView ? <FaList /> : <FaTh />}
          </Button>
        </Card.Header>
        <Card.Body>
          {isGridView ? (
            <PlantGrid
              isLoading={isLoading}
              plants={plants}
              handlePlantClick={handlePlantClick}
              navigate={navigate}
            />
          ) : (
            <PlantListTable
              plants={plants}
              isLoading={isLoading}
              handlePlantClick={handlePlantClick}
              navigate={navigate}
            />
          )}
        </Card.Body>
      </Card>
      {!isLoading && isYourPlants && (
        <FloatingActionButton
          icon={<FaPlus />}
          handleOnClick={() => {
            navigate(`/plants/create/${nextPlantId}`);
          }}
        />
      )}
    </BaseLayout>
  );
}
