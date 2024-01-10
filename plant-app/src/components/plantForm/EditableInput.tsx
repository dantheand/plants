import React from "react";
import { Col, Form, Row } from "react-bootstrap";

interface EditableInputProps {
  label: string;
  type: string;
  value: string | number | string[] | undefined;
  editsAllowed?: boolean;
  OnChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isEditable: boolean;
  isRequired?: boolean;
}

export const EditableInput = ({
  label,
  type,
  value,
  editsAllowed = true,
  OnChange,
  isEditable,
  isRequired = false,
}: EditableInputProps) => {
  return (
    <Form.Group as={Row} className="m-2">
      <Form.Label column md={3}>
        {label} {isRequired && <span className="required-asterisk">*</span>}
      </Form.Label>
      <Col md={9}>
        <Form.Control
          required={isRequired}
          type={type}
          value={value}
          onChange={OnChange}
          disabled={!(isEditable && editsAllowed)}
        />
      </Col>
    </Form.Group>
  );
};
