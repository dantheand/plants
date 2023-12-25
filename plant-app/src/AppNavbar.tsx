import { Container, Nav, Navbar } from "react-bootstrap";
import plantBrandIcon from "./assets/plant_logo_leaf_only_small.png";
import { APP_BRAND_NAME } from "./constants";
import React from "react";

export const AppNavbar = () => {
  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container>
        <Navbar.Brand href="/plants/">
          <img
            src={plantBrandIcon}
            width="40"
            height="40"
            className="d-inline-block"
            alt="Brand Icon"
          />{" "}
          {APP_BRAND_NAME}
        </Navbar.Brand>

        <Nav className="me-auto">
          {" "}
          <Nav.Link href="/users">Users</Nav.Link>
          <Nav.Link href="/plants">My Plants</Nav.Link>
          <Nav.Link href="/lineages">Lineages</Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};
