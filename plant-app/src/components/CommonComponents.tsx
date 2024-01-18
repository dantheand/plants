import React from "react";

import { Button, Form, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";

export function BackButton() {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate("/plants"); // Go back to the previous page
  };

  return (
    <Button variant="secondary" onClick={handleBackClick} className="mb-3">
      <FaArrowLeft /> Back
    </Button>
  );
}

interface DeleteButtonProps {
  entityName: string;
  confirmationText: string;
  deleteFunction: () => void;
}

// TODO: reuse this component for image deletion
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
    <div className="d-flex justify-content-center align-items-center">
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
