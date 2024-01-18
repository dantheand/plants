import { Placeholder, Table } from "react-bootstrap";
import React from "react";
import { Plant } from "../../types/interfaces";
import { NavigateFunction } from "react-router-dom";

interface RenderListItemsProps {
  isLoading: boolean;
  plants?: Plant[];
  handlePlantClick: (plantID: string, navigate: NavigateFunction) => void;
  navigate: NavigateFunction;
}

export const PlantListTable = ({
  isLoading,
  plants,
  handlePlantClick,
  navigate,
}: RenderListItemsProps) => {
  return (
    <Table bordered hover responsive className="mx-3 my-3 custom-table">
      <thead>
        <tr>
          <th className="column-id">ID</th>
          <th className="column-name">Plant Name</th>
        </tr>
      </thead>
      <tbody>
        {renderTableRows({ isLoading, plants, handlePlantClick, navigate })}
      </tbody>
    </Table>
  );
};
const renderTableRows = ({
  isLoading,
  plants,
  handlePlantClick,
  navigate,
}: RenderListItemsProps) => {
  if (isLoading || !plants) {
    return [...Array(10)].map(
      (
        _,
        idx, // Change this number to increase placeholder rows
      ) => (
        <tr key={idx}>
          <td colSpan={2}>
            <Placeholder as="div" animation="glow">
              <Placeholder xs={12} size="lg" />
            </Placeholder>
          </td>
        </tr>
      ),
    );
  } else {
    return plants.map((plant) => (
      <tr
        key={plant.plant_id}
        onClick={() => handlePlantClick(plant.plant_id, navigate)}
        className="clickable-item"
      >
        <td className="column-id">{plant.human_id}</td>
        <td className="column-name">{plant.human_name}</td>
      </tr>
    ));
  }
};
