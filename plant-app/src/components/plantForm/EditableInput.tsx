import React from "react";
import { Button, Col, Form, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

interface EditableInputProps {
  label: string;
  type: string;
  value: string | number | string[] | undefined;
  editsAllowed?: boolean;
  OnChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isEditable: boolean;
  isRequired?: boolean;
  placeholder?: string;
}

export const EditableInput = ({
  label,
  type,
  value,
  editsAllowed = true,
  OnChange,
  isEditable,
  isRequired = false,
  placeholder,
}: EditableInputProps) => {
  return (
    <Form.Group as={Row} className="m-2">
      <Form.Label column md={3}>
        {label} {isRequired && <span className="required-asterisk">*</span>}
      </Form.Label>
      <Col md={9} className="plant-form-item">
        <Form.Control
          required={isRequired}
          type={type}
          value={value}
          onChange={OnChange}
          disabled={!(isEditable && editsAllowed)}
          placeholder={isEditable ? placeholder : undefined}
        />
      </Col>
    </Form.Group>
  );
};

interface NonEditableInputProps {
  label: string;
  value: string[] | undefined;
}

export const NonEditableInputWButtons = ({
  label,
  value,
}: NonEditableInputProps) => {
  const navigate = useNavigate();

  return (
    <Form.Group as={Row} className="m-2">
      <Form.Label column md={3}>
        {label}
      </Form.Label>
      <Col md={9} className="plant-form-item">
        {value ? (
          value.map((val, idx) => (
            <Button key={idx} variant="outline-primary" className="m-1">
              {val}
            </Button>
          ))
        ) : (
          <Form.Control readOnly={true} disabled={true} />
        )}
      </Col>
    </Form.Group>
  );
};
