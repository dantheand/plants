import React from "react";

import { Button, Form, Modal } from "react-bootstrap";

interface DeleteButtonProps {
  buttonText: string;
  confirmationText: string;
  deleteFunction: () => void;
}

// TODO: reuse this component for image deletion
export const DeleteButtonWConfirmation = ({
  buttonText,
  confirmationText,
  deleteFunction,
}: DeleteButtonProps) => {
  const [showConfirmation, setShowConfirmation] = React.useState(false);
  const [confirmationInput, setConfirmationInput] = React.useState("");

  const openModal = () => setShowConfirmation(true);
  const closeModal = () => setShowConfirmation(false);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setConfirmationInput(e.target.value);

  const handleDelete = () => {
    if (confirmationInput.toLowerCase() === confirmationText) {
      closeModal();
      // API call to delete plant and redirect to plants list
      deleteFunction();
    } else {
      alert("Incorrect confirmation text");
    }
  };

  return (
    <div className="d-flex justify-content-center align-items-center">
      <Button variant="danger" onClick={openModal}>
        {buttonText}
      </Button>
      <Modal show={showConfirmation} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Removal</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to go through with this deletion? This action
            cannot be undone.
          </p>
          <p>
            If the plant has died, been gifted, or turned into another plant,
            add a "sink" value to this plant instead of deleting it.
          </p>
          <p>
            Type <b>{confirmationText}</b> to confirm:
          </p>
          <Form.Control
            type="text"
            value={confirmationInput}
            onChange={handleInputChange}
            placeholder={confirmationText}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleDelete();
              }
            }}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeModal}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Finalize Removal
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};
