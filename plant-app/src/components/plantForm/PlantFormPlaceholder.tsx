import { Card } from "react-bootstrap";
import React from "react";
import { PlantFormHeader } from "./PlantFormHeader";
import { EditableInputPlaceholder } from "./EditableInput";

export const PlantFormPlaceholder = () => {
  return (
    <Card className="top-level-card">
      <PlantFormHeader
        isFormEditable={false}
        toggleEditable={() => {}}
        isFormNewPlant={false}
        buttonsDisabled={true}
        isYourPlant={false}
      />
      <Card.Body>
        <>
          <EditableInputPlaceholder
            label="Unique ID Number"
            isRequired={true}
          />
          <EditableInputPlaceholder label="Plant Name" isRequired={true} />
          <EditableInputPlaceholder label="Species" />
          <EditableInputPlaceholder label="Location" />
          <EditableInputPlaceholder label="Parent Plant ID(s)" />
          <EditableInputPlaceholder label="Source" isRequired={true} />
          <EditableInputPlaceholder label="Source Date" isRequired={true} />
          <EditableInputPlaceholder label="Sink" />
          <EditableInputPlaceholder label="Sink Date" />
          <EditableInputPlaceholder label="Notes" />
        </>
      </Card.Body>
    </Card>
  );
};
