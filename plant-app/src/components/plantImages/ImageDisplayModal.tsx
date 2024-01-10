import { NewPlantImage } from "../../types/interfaces";
import { Button, Image, Modal } from "react-bootstrap";
import { convertTimestampToDateString } from "../../utils/utils";
import React from "react";

interface ImageDisplayModalProps {
  show: boolean;
  onHide: () => void;
  image: NewPlantImage;
  onDelete: (image: NewPlantImage) => void;
}

export function ImageDisplayModal({
  show,
  onHide,
  image,
  onDelete,
}: ImageDisplayModalProps) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {convertTimestampToDateString(image.timestamp)}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Image src={image.signed_full_photo_url} alt="Plant" fluid />
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        <Button variant="danger" onClick={() => onDelete(image)}>
          Delete Image
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
