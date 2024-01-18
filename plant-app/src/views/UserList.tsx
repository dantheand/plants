import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Card, Col, Container, Placeholder, Row } from "react-bootstrap";

import "../styles/styles.css";
import { User } from "../types/interfaces";
import { useAlert } from "../context/Alerts";

type UserCardProps = {
  user: User;
};

export const UserCard: React.FC<UserCardProps> = ({ user }) => (
  <Col>
    <Card>
      <Card.Body>
        <Card.Title>{user.email}</Card.Title>
        <Card.Text>Number of Plants: {user.n_plants}</Card.Text>
      </Card.Body>
    </Card>
  </Col>
);

export const PlaceholderCard: React.FC = () => (
  <Col>
    <Card>
      <Card.Body>
        <Placeholder as={Card.Title} animation="glow">
          <Placeholder xs={7} />
        </Placeholder>
        <Placeholder as={Card.Text} animation="glow">
          <Placeholder xs={4} /> <Placeholder xs={1} />
        </Placeholder>
      </Card.Body>
    </Card>
  </Col>
);

export function UserList(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert } = useAlert();

  useEffect(() => {
    fetch(`${BASE_API_URL}/users`, {
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
          return b.n_plants - a.n_plants;
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
    <Container className="p-5 mb-4 bg-light rounded-3">
      <h2>Users</h2>
      <Row xs={1} md={2} lg={3} className="g-4">
        {isLoading
          ? Array.from({ length: 6 }).map((_, idx) => (
              <PlaceholderCard key={idx} />
            ))
          : users.map((user) => <UserCard key={user.google_id} user={user} />)}
      </Row>
    </Container>
  );
}
