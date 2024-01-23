import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Button, Card, ListGroup, Placeholder } from "react-bootstrap";

import "../styles/styles.scss";
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
    <ListGroup.Item as="li" className="mb-2">
      <h5>{user.email}</h5>
      <p></p>
      <p>Current Plants: {user.n_active_plants}</p>
      <p>Total Plants: {user.n_total_plants}</p>
      <Button
        variant="primary"
        onClick={() => {
          navigate(`/plants/user/${user.google_id}`);
        }}
      >
        Observe Plants
      </Button>
    </ListGroup.Item>
  );
};

export const PlaceholderCard: React.FC = () => (
  <ListGroup.Item as="li" className="mb-2">
    <Placeholder as="h5" animation="glow">
      <Placeholder style={{ width: 300 }} />
    </Placeholder>
    <Placeholder as="p" animation="glow">
      <Placeholder style={{ width: 100 }} />{" "}
      <Placeholder style={{ width: 40 }} />
    </Placeholder>
    <Placeholder as="p" animation="glow">
      <Placeholder style={{ width: 100 }} />{" "}
      <Placeholder style={{ width: 40 }} />
    </Placeholder>
    <Placeholder.Button variant="primary" style={{ width: 110 }} />
  </ListGroup.Item>
);

export function UserList(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetch(`${BASE_API_URL}/users/`, {
      credentials: "include",
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
  }, [showAlert]);

  return (
    <BaseLayout>
      <Card className="top-level-card">
        <Card.Header as="h4">All Users</Card.Header>
        <Card.Body>
          <ListGroup as="ol" variant="flush">
            {isLoading
              ? Array.from({ length: 6 }).map((_, idx) => (
                  <PlaceholderCard key={idx} />
                ))
              : users.map((user) => (
                  <UserCard key={user.google_id} user={user} />
                ))}
          </ListGroup>
        </Card.Body>
      </Card>
    </BaseLayout>
  );
}
