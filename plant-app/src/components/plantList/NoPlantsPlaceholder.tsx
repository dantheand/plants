import { FaSeedling } from "react-icons/fa";
import React from "react";

export function NoPlantsPlaceholder() {
  return (
    <div className="text-center no-item-message">
      <FaSeedling className="no-item-icon" />
      <p>No plants found. Have you uploaded any?</p>
    </div>
  );
}
