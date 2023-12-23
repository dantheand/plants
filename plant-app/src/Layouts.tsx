import { Button, Container, Form, Modal } from "react-bootstrap";
import { BackButton } from "./commonComponents";
import React, { ReactNode } from "react";

interface DeleteButtonProps {
  entityName: string;
  confirmationText: string;
  deleteFunction: () => void;
}

const DeleteButtonWConfirmation = ({
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
            Type <em>{confirmationText}</em> to confirm:
          </p>
          <Form.Control
            type="text"
            placeholder={confirmationText}
            value={confirmationInput}
            onChange={handleInputChange}
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

const hardcodedPlantId = 400;
const hardcodedConfirmationText = `delete ${hardcodedPlantId}`;
const deleteFunction = () => {
  alert("deleted!");
};

export const PlantLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Container className="my-4">
      <BackButton />{" "}
      {/*TODO: Either use context API to pass this info to DeleteButton, put the component in plantdetails,
      or raise the state*/}
      <DeleteButtonWConfirmation
        entityName="Plant"
        confirmationText={hardcodedConfirmationText}
        deleteFunction={deleteFunction}
      />
      {children}
    </Container>
  );
};
