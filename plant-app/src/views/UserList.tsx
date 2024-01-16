import React, { JSX, useEffect } from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { Container } from "react-bootstrap";

import "../styles/styles.css";

export function UserList(): JSX.Element {
  useEffect(() => {
    fetch(`${BASE_API_URL}/users`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem(JWT_TOKEN_STORAGE)}`,
      },
    })
      .then((response) => response.json())
      .then((data) => {
        console.log(data);
      });
  }, []);

  return (
    <Container className="p-5 mb-4 bg-light rounded-3">
      <h2>All Users</h2>
      {/*TODO: List user email and number of plants*/}
    </Container>
  );
}
