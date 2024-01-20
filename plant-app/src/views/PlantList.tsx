import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import React, { JSX, useContext, useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Card } from "react-bootstrap";

import { Plant } from "../types/interfaces";
import { FaPlus } from "react-icons/fa";

import "../styles/styles.scss";
import { PlantListTable } from "../components/plantList/PlantListTable";
import { BaseLayout } from "../components/Layouts";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { useAlert } from "../context/Alerts";
import { getGoogleIdFromToken } from "../utils/GetGoogleIdFromToken";

function incrementLargestId(plants: Plant[]): number {
  if (plants.length === 0) {
    return 0;
  }

  return plants.reduce((maxHumanId, plant) => {
    if (plant.human_id > maxHumanId) {
      return plant.human_id;
    }
    return maxHumanId + 1;
  }, plants[0].human_id); // Initialize with the human_id of the first plant
}

const handlePlantClick = (plantID: string, navigate: NavigateFunction) => {
  navigate(`/plants/${plantID}`);
};

export function PlantList(): JSX.Element {
  const params = useParams<string>();
  const pathSpecifiedId = params.userId;
  const [isYourPlants, setIsYourPlants] = useState<boolean>(true);
  const { showAlert } = useAlert();
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [isShowOnlyCurrentPlants, setIsShowOnlyCurrentPlants] =
    useState<boolean>(true);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nextPlantId, setNextPlantId] = useState<number>(0);
  const navigate = useNavigate();
  let userIdToQuery: string | null = null;

  if (pathSpecifiedId === "me" || pathSpecifiedId === undefined) {
    userIdToQuery = getGoogleIdFromToken();
  } else {
    userIdToQuery = pathSpecifiedId;
  }

  const currentUserId = getGoogleIdFromToken();

  useEffect(() => {
    // This is to prevent the user from seeing the wrong list of plants
    setIsLoading(true);
    if (userIdToQuery === currentUserId) {
      setIsYourPlants(true);
    } else {
      setIsYourPlants(false);
    }
  }, [userIdToQuery]);

  useEffect(() => {
    setIsLoading(true);

    fetch(`${BASE_API_URL}/plants/user/${userIdToQuery}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
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
        setIsLoading(false);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [pathSpecifiedId, showAlert]);

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
      {isYourPlants && (
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
