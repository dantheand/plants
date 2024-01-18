import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Button, Card, Col, Placeholder, Row } from "react-bootstrap";

import "../styles/styles.css";
import { User } from "../types/interfaces";
import { useAlert } from "../context/Alerts";
import { BaseLayout } from "../components/Layouts";
import { useNavigate } from "react-router-dom";

type UserCardProps = {
  user: User;
};

export const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const navigate = useNavigate();

  return (
    <Col>
      <Card>
        <Card.Header as="h5">{user.email}</Card.Header>
        <Card.Body>
          <Card.Text>Active Plants: {user.n_active_plants}</Card.Text>
          <Card.Text>Total Plants: {user.n_total_plants}</Card.Text>
          <Button
            variant="primary"
            onClick={() => {
              navigate(`/plants/user/${user.google_id}`);
            }}
          >
            {" "}
            View Plants{" "}
          </Button>
        </Card.Body>
      </Card>
    </Col>
  );
};

export const PlaceholderCard: React.FC = () => (
  <Col>
    <Card>
      <Placeholder as={Card.Header} animation="glow">
        <Placeholder xs={7} />
      </Placeholder>
      <Card.Body>
        <Placeholder as={Card.Text} animation="glow">
          <Placeholder xs={4} /> <Placeholder xs={1} />
        </Placeholder>
        <Placeholder as={Card.Text} animation="glow">
          <Placeholder xs={4} /> <Placeholder xs={1} />
        </Placeholder>
        <Placeholder.Button variant="primary" xs={4} />
      </Card.Body>
    </Card>
  </Col>
);

export function UserList(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetch(`${BASE_API_URL}/users/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
      })
      .then((data) => {
        const sortedUsers = data.sort((a: User, b: User) => {
          return b.n_active_plants - a.n_active_plants;
        });

        setUsers(sortedUsers);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Fetching users failed:", error);
        showAlert(`Error fetching users: ${error}`, "danger");
        setIsLoading(false);
      });
  }, []);

  return (
    <BaseLayout>
      <Card className="mb-3">
        <Card.Header as="h4">Users</Card.Header>
        <Card.Body>
          <Row xs={1} md={2} lg={3} className="g-4">
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <PlaceholderCard key={idx} />
                ))
              : users.map((user) => (
                  <UserCard key={user.google_id} user={user} />
                ))}
          </Row>
        </Card.Body>
      </Card>
    </BaseLayout>
  );
}
