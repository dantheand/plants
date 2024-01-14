import { NavigateFunction, useNavigate } from "react-router-dom";
import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Container } from "react-bootstrap";

import { JwtPayload, Plant } from "../types/interfaces";
import { FaPlus } from "react-icons/fa";

import "../styles/styles.css";
import { FloatingActionButton } from "../components/CommonComponents";
import { jwtDecode } from "jwt-decode";
import { PlantListTable } from "../components/plantList/PlantListTable";

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
    <Container className="p-5 mb-4 bg-light rounded-3">
      <h2>All Plants</h2>
      <FloatingActionButton
        icon={<FaPlus />}
        handleOnClick={navigateToCreatePlant}
      />
      <PlantListTable
        plants={plants}
        isLoading={isLoading}
        handlePlantClick={handlePlantClick}
        navigate={navigate}
      />
    </Container>
  );
}
