import { NavigateFunction, useNavigate } from "react-router-dom";
import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Card, Container, Placeholder } from "react-bootstrap";

import { JwtPayload, Plant } from "../types/interfaces";
import { FaPlus } from "react-icons/fa";

import "../styles/styles.css";
import { FloatingActionButton } from "../components/CommonComponents";
import { jwtDecode } from "jwt-decode";
import { PlantListTable } from "../components/plantList/PlantListTable";
import { BaseLayout } from "../components/Layouts";

const handlePlantClick = (plantID: string, navigate: NavigateFunction) => {
  navigate(`/plants/${plantID}`);
};

export function PlantList(): JSX.Element {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const navigateToCreatePlant = () => {
    navigate("/plants/create");
  };

  useEffect(() => {
    const token = localStorage.getItem(JWT_TOKEN_STORAGE);
    let google_id: string | null = null;

    if (token) {
      const decoded: JwtPayload = jwtDecode<JwtPayload>(token);
      google_id = decoded.google_id;
    }

    if (!google_id) {
      console.error("Google ID not found in token");
      return;
    }

    fetch(`${BASE_API_URL}/plants/user/${google_id}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        const sortedPlants = data.sort((a: Plant, b: Plant) => {
          return a.human_id - b.human_id;
        });
        setPlants(sortedPlants);
        setIsLoading(false);
      });
  }, []);

  return (
    <BaseLayout>
      <Card className="mb-3">
        <Card.Header as="h4">Your Plants</Card.Header>
        <Card.Body>
          <PlantListTable
            plants={plants}
            isLoading={isLoading}
            handlePlantClick={handlePlantClick}
            navigate={navigate}
          />
        </Card.Body>
      </Card>
      <FloatingActionButton
        icon={<FaPlus />}
        handleOnClick={navigateToCreatePlant}
      />
    </BaseLayout>
  );
}
