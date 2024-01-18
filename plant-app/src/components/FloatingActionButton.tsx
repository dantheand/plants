import React from "react";
import { Button } from "react-bootstrap";

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  handleOnClick: () => void;
}

export const FloatingActionButton = ({
  icon,
  handleOnClick,
}: FloatingActionButtonProps) => {
  return (
    <Button
      variant="primary"
      className="floating-action-button"
      onClick={handleOnClick}
    >
      {icon}
    </Button>
  );
};
