import { Spinner } from "react-bootstrap";
import React from "react";

export const PlantImagesLoadingPlaceholder = () => {
  return (
    <div>
      <Spinner />
      Loading images...
    </div>
  );
};
