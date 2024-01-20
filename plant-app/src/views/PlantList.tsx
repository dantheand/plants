import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Card } from "react-bootstrap";

import { JwtPayload, Plant } from "../types/interfaces";
import { FaPlus } from "react-icons/fa";

import "../styles/styles.scss";
import { jwtDecode } from "jwt-decode";
import { PlantListTable } from "../components/plantList/PlantListTable";
import { BaseLayout } from "../components/Layouts";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { useAlert } from "../context/Alerts";

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
  const otherUserId = params.userId;
  const { showAlert } = useAlert();
  const [isGridView, setIsGridView] = useState<boolean>(false);
  const [isShowOnlyCurrentPlants, setIsShowOnlyCurrentPlants] =
    useState<boolean>(true);

  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [nextId, setNextId] = useState<number>(0);
  const navigate = useNavigate();

  useEffect(() => {
    setIsLoading(true);
    let google_id: string | null = null;

    if (!otherUserId) {
      const token = localStorage.getItem(JWT_TOKEN_STORAGE);
      if (token) {
        const decoded: JwtPayload = jwtDecode<JwtPayload>(token);
        google_id = decoded.google_id;
      }

      if (!google_id) {
        console.error("Google ID not found in token");
        return;
      }
    } else {
      google_id = otherUserId;
    }

    fetch(`${BASE_API_URL}/plants/user/${google_id}`, {
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
        setNextId(incrementLargestId(sortedPlants));
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
  }, [otherUserId]);

  return (
    <BaseLayout>
      <Card className="mb-3">
        <Card.Header as="h4">
          {otherUserId ? "Your Friend's Plants" : "Your Plants"}
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
      {!otherUserId && (
        <FloatingActionButton
          icon={<FaPlus />}
          handleOnClick={() => {
            navigate(`/plants/create/${nextId}`);
          }}
        />
      )}
    </BaseLayout>
  );
}
