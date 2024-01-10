import { Card, Placeholder } from "react-bootstrap";
import React from "react";

export const PlantFormPlaceholder = () => {
  return (
    <Card className="mb-3">
      <Card.Header as="h4">Plant Information</Card.Header>
      <Card.Body>
        {[...Array(8)].map((_, idx) => (
          <Placeholder key={idx} as="p" animation="glow">
            <Placeholder xs={12} />
          </Placeholder>
        ))}
      </Card.Body>
    </Card>
  );
};
