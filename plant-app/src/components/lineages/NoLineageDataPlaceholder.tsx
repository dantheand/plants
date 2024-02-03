import { FaProjectDiagram } from "react-icons/fa";
import React from "react";

export function NoImagesPlaceholder() {
  return (
    <div className="text-center no-item-message">
      <FaProjectDiagram className="no-item-icon" />
      <p>No lineage data available. Have you uploaded any plants?</p>
    </div>
  );
}
