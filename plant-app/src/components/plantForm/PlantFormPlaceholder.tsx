import { Card, Placeholder } from "react-bootstrap";
import React from "react";
import { PlantFormHeader } from "./PlantFormHeader";

export const PlantFormPlaceholder = () => {
  return (
    <Card className="mb-3">
      <PlantFormHeader
        isFormEditable={false}
        toggleEditable={() => {}}
        isFormNewPlant={false}
        buttonsDisabled={true}
      />
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
