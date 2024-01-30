import { PlantImage } from "../../types/interfaces";
import { Button, Modal } from "react-bootstrap";
import { convertTimestampToDateString } from "../../utils/utils";
import React from "react";
import "../../styles/styles.scss";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

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
        <LazyLoadImage
          // TODO: figure out why this doesnt load the thumbnail image that was previously loaded
          placeholderSrc={image.signed_thumbnail_photo_url}
          src={image.signed_full_photo_url}
          alt="Plant"
          className={"flexible-image"}
          wrapperProps={{
            // If you need to, you can tweak the effect transition using the wrapper style.
            style: { transitionDelay: "0.2s" },
          }}
          effect="blur"
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
