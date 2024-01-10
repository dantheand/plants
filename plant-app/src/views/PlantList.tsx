import { NavigateFunction, useNavigate } from "react-router-dom";
import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL, HARDCODED_USER, JWT_TOKEN_STORAGE } from "../constants";
import { Container, ListGroup, Placeholder } from "react-bootstrap";

import { Plant } from "../types/interfaces";
import { FaPlus } from "react-icons/fa";

import "../styles/styles.css";
import { FloatingActionButton } from "../components/CommonComponents";

const handlePlantClick = (plantID: string, navigate: NavigateFunction) => {
  navigate(`/plants/${plantID}`);
};

interface RenderListItemsProps {
  isLoading: boolean;
  plants?: Plant[];
  handlePlantClick: (plantID: string, navigate: NavigateFunction) => void;
  navigate: NavigateFunction;
}
// Function to render List Items
const renderListItems = ({
  isLoading,
  plants,
  handlePlantClick,
  navigate,
}: RenderListItemsProps) => {
  if (isLoading || !plants) {
    return [...Array(10)].map((_, idx) => (
      <ListGroup.Item key={idx}>
        <Placeholder as="div" animation="glow">
          <Placeholder xs={12} size="lg" />
        </Placeholder>
      </ListGroup.Item>
    ));
  } else {
    return plants.map((plant) => (
      <ListGroup.Item
        key={plant.plant_id}
        onClick={() => handlePlantClick(plant.plant_id, navigate)}
        className="clickable-item"
      >
        {plant.human_id} - {plant.human_name}
      </ListGroup.Item>
    ));
  }
};

export function PlantList(): JSX.Element {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  const navigateToCreatePlant = () => {
    navigate("/plants/create");
  };

  useEffect(() => {
    fetch(`${BASE_API_URL}/plants/user/${HARDCODED_USER}`, {
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
      <ListGroup>
        {renderListItems({ isLoading, plants, handlePlantClick, navigate })}
      </ListGroup>
    </Container>
  );
}
