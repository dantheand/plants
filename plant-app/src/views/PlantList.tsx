import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL } from "../constants";
import { Card } from "react-bootstrap";

import { Plant } from "../types/interfaces";
import { FaPlus } from "react-icons/fa";

import "../styles/styles.scss";
import { PlantListTable } from "../components/plantList/PlantListTable";
import { BaseLayout } from "../components/Layouts";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { useAlert } from "../context/Alerts";
import { useAuth } from "../context/Auth";
import { useApi } from "../utils/api";

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
  // const [isGridView, setIsGridView] = useState<boolean>(false);
  // const [isShowOnlyCurrentPlants, setIsShowOnlyCurrentPlants] =

  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nextPlantId, setNextPlantId] = useState<number>(0);
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const { callApi } = useApi();
  const { userId } = useAuth();

  // Set query ID based on URL path or user ID
  useEffect(() => {
    if (pathSpecifiedId === "me" || pathSpecifiedId === undefined) {
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
        <Card.Header as="h4">
          {isYourPlants ? "Your Plants" : "Your Friend's Plants"}
        </Card.Header>
        <Card.Body>
          <PlantListTable
            plants={plants}
            isLoading={isLoading}
            handlePlantClick={handlePlantClick}
            navigate={navigate}
          />
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
