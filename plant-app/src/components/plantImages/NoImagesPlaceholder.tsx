import { FaImages } from "react-icons/fa";
import React from "react";

export function NoImagesPlaceholder() {
  return (
    <div className="text-center no-item-message">
      <FaImages className="no-item-icon" />
      <p>No images found. Have a picture of this plant? Upload it!</p>
    </div>
  );
}
