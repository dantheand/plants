import React from "react";

import { Button, Form, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

export function BackButton() {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1); // Go back to the previous page
  };

  return (
    <Button variant="secondary" onClick={handleBackClick} className="mb-3">
      &#8592; Back
    </Button>
  );
}

interface DeleteButtonProps {
  entityName: string;
  confirmationText: string;
  deleteFunction: () => void;
}

export const DeleteButtonWConfirmation = ({
  entityName,
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
    if (confirmationInput === confirmationText) {
      closeModal();
      // API call to delete plant and redirect to plants list
      deleteFunction();
    } else {
      alert("incorrect confirmation");
    }
  };

  return (
    <div className="mb-3 float-end">
      <Button variant="danger" onClick={openModal}>
        Delete {entityName}
      </Button>
      <Modal show={showConfirmation} onHide={closeModal}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Are you sure you want to go through with this {entityName} deletion?
            This action cannot be undone.
          </p>
          <p>
            Type <b>{confirmationText}</b> to confirm:
          </p>
          <Form.Control
            type="text"
            value={confirmationInput}
            onChange={handleInputChange}
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
            Confirm Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

interface FloatingActionButtonProps {
  icon: React.ReactNode;
  handleOnClick: () => void;
}

export const FloatingActionButton = ({
  icon,
  handleOnClick,
}: FloatingActionButtonProps) => {
  return (
    <Button
      variant="primary"
      className="floating-action-button"
      onClick={handleOnClick}
    >
      {icon}
    </Button>
  );
};
