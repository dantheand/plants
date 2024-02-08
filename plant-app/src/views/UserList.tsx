import React, { JSX, useEffect, useState } from "react";
import { BASE_API_URL } from "../constants";
import { Button, Card, ListGroup, Placeholder } from "react-bootstrap";

import { formatDistanceToNow } from "date-fns";

import "../styles/styles.scss";
import { User } from "../types/interfaces";
import { useAlert } from "../context/Alerts";
import { BaseLayout } from "../components/Layouts";
import { useNavigate } from "react-router-dom";
import { useApi } from "../utils/api";
import { FaHourglassHalf, FaProjectDiagram, FaSeedling } from "react-icons/fa";

export const PlaceholderCard: React.FC = () => (
  <ListGroup.Item as="li" className="mb-2">
    <Placeholder as="h5" animation="glow">
      <Placeholder style={{ width: 90 }} />
    </Placeholder>
    <p></p>
    <Placeholder as="p" animation="glow">
      <Placeholder style={{ width: 105 }} />{" "}
      <Placeholder style={{ width: 40 }} />
    </Placeholder>
    <Placeholder as="p" animation="glow">
      <Placeholder style={{ width: 90 }} />{" "}
      <Placeholder style={{ width: 40 }} />
    </Placeholder>
    <Placeholder.Button
      variant="success"
      className={"mb-2"}
      style={{ width: 100 }}
    />
    <Placeholder.Button
      variant="primary"
      className={"mx-3 mb-2"}
      style={{ width: 110 }}
    />
  </ListGroup.Item>
);

export function UserList(): JSX.Element {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { showAlert } = useAlert();
  const { callApi } = useApi();

  useEffect(() => {
    callApi(`${BASE_API_URL}/users/`, {})
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
  }, [showAlert, callApi]);

  return (
    <BaseLayout>
      <Card className="top-level-card">
        <Card.Header as="h4">Current Users</Card.Header>
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

type UserCardProps = {
  user: User;
};

const UserCard: React.FC<UserCardProps> = ({ user }) => {
  const navigate = useNavigate();
  const createdAtDate = new Date(user.created_at);
  const timeAgo = formatDistanceToNow(createdAtDate, { addSuffix: true });

  return (
    <ListGroup.Item as="li" className="mb-2">
      <h5>
        {user.given_name} {user.last_initial}.
      </h5>
      <p></p>
      <p>Tracking since: {timeAgo}</p>
      <p>Current Plants: {user.n_active_plants}</p>
      <p>Total Plants: {user.n_total_plants}</p>
      <Button
        variant="success"
        // Set disabled if the user has a private profile
        disabled={!user.is_public_profile}
        className={"mb-2"}
        onClick={() => {
          navigate(`/plants/user/${user.google_id}`);
        }}
      >
        <FaSeedling className={"me-2"} /> Plants
      </Button>
      <Button
        variant="primary"
        disabled={!user.is_public_profile}
        className={"mx-3 mb-2"}
        onClick={() => {
          navigate(`/lineages/user/${user.google_id}`);
        }}
      >
        <FaProjectDiagram className={"me-2"} /> Lineages
      </Button>
    </ListGroup.Item>
  );
};
