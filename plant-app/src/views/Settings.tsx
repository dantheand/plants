import { BaseLayout } from "../components/Layouts";
import { Accordion, Card, Form, Spinner } from "react-bootstrap";
import React, { JSX, useCallback, useEffect, useState } from "react";
import { APP_BRAND_NAME, BASE_API_URL } from "../constants";
import { useApi } from "../utils/api";
import { useAlert } from "../context/Alerts";

export function Settings(): JSX.Element {
  const [isProfilePublic, setIsProfilePublic] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { callApi } = useApi();
  const { showAlert } = useAlert();

  const fetchProfileVisibility = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await callApi(BASE_API_URL + "/users/me");
      if (!response.ok) throw new Error("Failed to fetch settings");
      const data = await response.json();
      setIsProfilePublic(data.is_public_profile);
    } catch (error) {
      showAlert("Failed to load profile settings", "danger");
    } finally {
      setIsLoading(false);
    }
  }, [callApi, showAlert]); // Add callApi and showAlert as dependencies

  useEffect(() => {
    fetchProfileVisibility();
  }, [fetchProfileVisibility]);

  const handleProfileVisibilityChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newVisibility = e.target.checked;
    setIsProfilePublic(newVisibility);
    try {
      const response = await callApi(
        BASE_API_URL + "/users/settings/visibility",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_public: newVisibility }),
        },
      );
      if (!response.ok) throw new Error("Failed to update settings");
      showAlert("Profile settings updated!", "success");
    } catch (error) {
      showAlert("Failed to update profile settings", "danger");
    }
  };

  return (
    <BaseLayout>
      <Card className="top-level-card">
        <Card.Header as="h4">Settings</Card.Header>
        <Card.Body>
          {isLoading ? (
            <div className="text-center">
              <Spinner animation="border" />
            </div>
          ) : (
            <Form>
              <Form.Group>
                <Form.Check
                  type="switch"
                  id="custom-switch"
                  label="Surveillance State Mode"
                  checked={isProfilePublic ?? false}
                  onChange={handleProfileVisibilityChange}
                  disabled={isLoading}
                />
                <Accordion className="mt-3">
                  <Accordion.Item eventKey="0">
                    <Accordion.Header>
                      Surveillance State Information
                    </Accordion.Header>
                    <Accordion.Body>
                      <p>
                        Activating Surveillance State Mode subjects your
                        botanical sanctum to the all-seeing eye of the
                        collective — where every sprout and lineage is cataloged
                        for public admiration and scrutiny. Deactivate it to
                        retreat from the prying eyes of your fellow observers.
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
          )}
        </Card.Body>
      </Card>
    </BaseLayout>
  );
}
