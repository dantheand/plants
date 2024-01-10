import { Modal } from "react-bootstrap";
import ImageUpload from "./ImageUpload";
import React from "react";

interface ImageUploadModalProps {
  show: boolean;
  onHide: () => void;
  plant_id: string;
  onUploadSuccess: () => void;
}

export function ImageUploadModal({
  show,
  onHide,
  plant_id,
  onUploadSuccess,
}: ImageUploadModalProps) {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Upload Image</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <ImageUpload
          plant_id={plant_id}
          closeModal={onHide}
          onUploadSuccess={onUploadSuccess}
        />
      </Modal.Body>
    </Modal>
  );
}
