import { Button } from "react-bootstrap";
import { FaPencilAlt, FaSave, FaTimes } from "react-icons/fa";
import React from "react";

interface PlantFormHeaderProps {
  isFormEditable: boolean;
  toggleEditable: () => void;
  isFormNewPlant: boolean;
  buttonsDisabled: boolean;
}
export const HeaderEditSaveButtons = ({
  isFormEditable,
  toggleEditable,
  isFormNewPlant,
  buttonsDisabled,
}: PlantFormHeaderProps) => {
  return (
    <div>
      {!isFormNewPlant && (
        <Button
          variant={isFormEditable ? "danger" : "secondary"}
          onClick={toggleEditable}
          className="mx-2"
          disabled={buttonsDisabled}
        >
          {isFormEditable ? <FaTimes /> : <FaPencilAlt />}
        </Button>
      )}
      <Button
        variant="primary"
        type="submit"
        disabled={!isFormEditable || buttonsDisabled}
      >
        <FaSave />
      </Button>
    </div>
  );
};
