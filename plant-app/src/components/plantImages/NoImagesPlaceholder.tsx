import { FaSeedling } from "react-icons/fa";
import React from "react";

export function NoImagesPlaceholder() {
  return (
    <div className="text-center no-images-message">
      <FaSeedling className="no-images-icon" />
      <p>Have a picture of this plant? Upload it!</p>
    </div>
  );
}
