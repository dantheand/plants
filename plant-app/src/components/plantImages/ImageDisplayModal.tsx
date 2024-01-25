import { PlantImage } from "../../types/interfaces";
import { Button, Image, Modal } from "react-bootstrap";
import { convertTimestampToDateString } from "../../utils/utils";
import React from "react";
import "../../styles/styles.scss";

interface ImageDisplayModalProps {
  show: boolean;
  onHide: () => void;
  image: PlantImage;
  onDelete: (image: PlantImage) => void;
  isYourPlant: boolean;
}

export function ImageDisplayModal({
  show,
  onHide,
  image,
  onDelete,
  isYourPlant,
}: ImageDisplayModalProps) {
  return (
    <Modal
      show={show}
      onHide={onHide}
      onClick={onHide}
      fullscreen
      className="no-padding-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {convertTimestampToDateString(image.timestamp)}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className={"flex-modal-body"}>
        <Image
          src={image.signed_full_photo_url}
          alt="Plant"
          fluid
          className={"flexible-image"}
        />
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        {isYourPlant ? (
          <Button variant="danger" onClick={() => onDelete(image)}>
            Delete Image
          </Button>
        ) : null}
        <Button onClick={onHide}>Close</Button>
      </Modal.Footer>
    </Modal>
  );
}
