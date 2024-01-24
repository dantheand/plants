import { Card } from "react-bootstrap";
import React from "react";
import { HeaderEditSaveButtons } from "./HeaderEditSaveButtons";

interface PlantFormHeaderProps {
  isFormEditable: boolean;
  toggleEditable: () => void;
  isFormNewPlant: boolean;
  buttonsDisabled: boolean;
  isYourPlant: boolean;
}

export const PlantFormHeader = ({
  isFormEditable,
  toggleEditable,
  isFormNewPlant,
  buttonsDisabled,
  isYourPlant,
}: PlantFormHeaderProps) => {
  return (
    <Card.Header
      as="h4"
      className="d-flex justify-content-between align-items-center"
    >
      <span>Plant Information</span>
      {isYourPlant && (
        <HeaderEditSaveButtons
          isFormEditable={isFormEditable}
          toggleEditable={toggleEditable}
          isFormNewPlant={isFormNewPlant}
          buttonsDisabled={buttonsDisabled}
        />
      )}
    </Card.Header>
  );
};
