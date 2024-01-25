import { Button } from "react-bootstrap";
import React from "react";

interface ParentIdButtonProps {
  idx: number;
  parent_id: string;
  handleParentClick: (parent_id: string) => void;
}

export const ParentIdButton = ({
  idx,
  parent_id,
  handleParentClick,
}: ParentIdButtonProps) => {
  return (
    <Button
      key={idx}
      variant="outline-primary"
      className="m-1"
      onClick={() => handleParentClick(parent_id)}
    >
      {parent_id}
    </Button>
  );
};
