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
    <Modal show={show} onHide={onHide} fullscreen>
      <Modal.Header closeButton>
        <Modal.Title>Upload Observation</Modal.Title>
      </Modal.Header>
      <Modal.Body className={"justify-content-center"}>
        <ImageUpload
          plant_id={plant_id}
          closeModal={onHide}
          onUploadSuccess={onUploadSuccess}
        />
      </Modal.Body>
    </Modal>
  );
}
