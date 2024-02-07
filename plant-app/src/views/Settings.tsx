import { BaseLayout } from "../components/Layouts";
import { Accordion, Card, Form } from "react-bootstrap";
import React, { JSX, useState } from "react";
import { APP_BRAND_NAME } from "../constants";

export function Settings(): JSX.Element {
  // State to manage profile visibility
  const [isProfilePublic, setIsProfilePublic] = useState<boolean>(true);

  const handleProfileVisibilityChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setIsProfilePublic(e.target.checked);
    // Here, you would typically also update the user's profile setting in your backend/database
  };

  return (
    <BaseLayout>
      <Card className="top-level-card">
        <Card.Header as="h4">Settings</Card.Header>
        <Card.Body>
          <Form>
            <Form.Group>
              <Form.Check
                type="switch"
                id="custom-switch"
                label="Surveillance State Mode"
                onChange={handleProfileVisibilityChange}
              />
              <Accordion className="mt-3">
                <Accordion.Item eventKey="0">
                  <Accordion.Header>
                    Surveillance State Information
                  </Accordion.Header>
                  <Accordion.Body>
                    <p>
                      Activating the Surveillance State Mode subjects your
                      botanical sanctum to the all-seeing eye of the collective
                      — where every sprout and lineage is cataloged for public
                      admiration and scrutiny. Deactivate it to retreat from the
                      Observers' prying eyes.
                    </p>
                    <p>
                      <strong>Activated:</strong> Your images, plants, and
                      lineage information are visible to everyone with a{" "}
                      {APP_BRAND_NAME} account.
                    </p>
                    <p>
                      <strong>Deactivated:</strong> Your images, plants, and
                      lineage information are hidden from other users. People
                      will still be able to see your first name, last initial,
                      and total number of plants you have.
                    </p>
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Form.Group>
          </Form>
        </Card.Body>
      </Card>
    </BaseLayout>
  );
}
