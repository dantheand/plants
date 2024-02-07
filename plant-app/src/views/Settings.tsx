import { BaseLayout } from "../components/Layouts";
import { Card } from "react-bootstrap";
import React, { JSX } from "react";

export function Settings(): JSX.Element {
  return (
    <BaseLayout>
      <Card className="top-level-card">
        <Card.Header as="h4">Settings</Card.Header>
        <Card.Body>Some settings will go here.</Card.Body>
      </Card>
    </BaseLayout>
  );
}
