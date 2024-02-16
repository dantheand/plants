import { NavigateFunction, useNavigate, useParams } from "react-router-dom";
import React, { JSX, useEffect, useState } from "react";
import { USE_GRID_VIEW } from "../constants";
import { Button, Card, Spinner } from "react-bootstrap";

import { FaPlus, FaList, FaTh } from "react-icons/fa";

import "../styles/styles.scss";
import { PlantListTable } from "../components/plantList/PlantListTable";
import { PlantGrid } from "../components/plantList/PlantGrid";
import { BaseLayout } from "../components/Layouts";
import { FloatingActionButton } from "../components/FloatingActionButton";
import { useAuth } from "../context/Auth";
import useLocalStorageState from "use-local-storage-state";
import { usePlants } from "../context/Plants";
import { NoPlantsPlaceholder } from "../components/plantList/NoPlantsPlaceholder";

const handlePlantClick = (plantID: string, navigate: NavigateFunction) => {
  navigate(`/plants/${plantID}`);
};

export function PlantList(): JSX.Element {
  const params = useParams<string>();
  const pathSpecifiedId = params.userId;
  const [isYourPlants, setIsYourPlants] = useState<boolean>(true);
  const [queryID, setQueryID] = useState<string | null>(null);
  const [isGridView, setIsGridView] = useLocalStorageState<boolean>(
    USE_GRID_VIEW,
    {
      defaultValue: false,
    },
  );

  const navigate = useNavigate();
  const { userId } = useAuth();
  const { plants, isLoading, nextPlantId, fetchPlants } = usePlants();

  // Set is your plants based on user ID
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

  // Fetch plants if query ID changes
  useEffect(() => {
    fetchPlants(queryID);
  }, [queryID, fetchPlants]);

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
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" />{" "}
              {/* Show loading spinner while fetching data */}
            </div>
          ) : plants.length > 0 ? (
            isGridView ? (
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
            )
          ) : (
            <NoPlantsPlaceholder />
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
