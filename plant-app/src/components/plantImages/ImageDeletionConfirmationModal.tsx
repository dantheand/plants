import { Button, Modal } from "react-bootstrap";
import React from "react";
import { NewPlantImage } from "../../types/interfaces";

interface ImageDeletionConfirmationModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: (image: NewPlantImage) => void;
  image: NewPlantImage;
}

export function ImageDeletionConfirmationModal({
  show,
  onHide,
  onConfirm,
  image,
}: ImageDeletionConfirmationModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Deletion</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to delete this image?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={() => onConfirm(image)}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
