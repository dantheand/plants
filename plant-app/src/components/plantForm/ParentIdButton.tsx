import { Button, Spinner } from "react-bootstrap";
import React from "react";

interface ParentIdButtonProps {
  idx: number;
  parent_id: string;
  handleParentClick: (parent_id: string) => void;
  navigationIsLoading: boolean;
}

export const ParentIdButton = ({
  idx,
  parent_id,
  handleParentClick,
  navigationIsLoading,
}: ParentIdButtonProps) => {
  return (
    <Button
      key={idx}
      variant="outline-primary"
      className="m-1"
      onClick={() => handleParentClick(parent_id)}
      disabled={navigationIsLoading}
    >
      {navigationIsLoading ? (
        <Spinner
          as="span"
          animation="border"
          size="sm"
          role="status"
          aria-hidden="true"
        />
      ) : (
        parent_id
      )}
    </Button>
  );
};
