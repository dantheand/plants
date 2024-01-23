import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../../context/Alerts";
import { BASE_API_URL } from "../../constants";
import { Col, Form, Row } from "react-bootstrap";
import { ParentIdButton } from "./ParentIdButton";
import { NewPlant } from "../../types/interfaces";

interface ParentIdInputProps {
  label: string;
  value: string[] | undefined;
  plant: NewPlant;
}

export const ParentIdInput = ({ label, value, plant }: ParentIdInputProps) => {
  const [navigationIsLoading, setNavigationIsLoading] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleParentClick = (parentHumanId: string) => {
    setNavigationIsLoading(true);
    // Query the API endpoint to get the parent plant ID and navigate to that plant's page
    fetch(`${BASE_API_URL}/plants/user/${plant.user_id}/${parentHumanId}`, {
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        navigate(`/plants/${data.plant_id}`);
        // Setting delay to give the new plant page time to load
        setTimeout(() => setNavigationIsLoading(false), 500); // Adjust delay as needed
      })
      .catch((error) => {
        setNavigationIsLoading(false);
        showAlert(`Error fetching parent: ${error}`, "danger");
      });
  };

  return (
    <Form.Group as={Row} className="m-2">
      <Form.Label column md={3}>
        {label}
      </Form.Label>
      <Col md={9} className="plant-form-item">
        {value ? (
          value.map((parent_id, idx) => (
            <ParentIdButton
              key={idx}
              idx={idx}
              parent_id={parent_id}
              handleParentClick={handleParentClick}
              navigationIsLoading={navigationIsLoading}
            />
          ))
        ) : (
          <Form.Control readOnly={true} disabled={true} />
        )}
      </Col>
    </Form.Group>
  );
};
