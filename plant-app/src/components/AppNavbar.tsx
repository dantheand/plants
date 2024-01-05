import { Container, Nav, Navbar } from "react-bootstrap";
import plantBrandIcon from "../assets/plant_logo_leaf_only_small.png";
import { APP_BRAND_NAME, JWT_TOKEN_STORAGE } from "../constants";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../context/Alerts"; // Assuming you are using react-router

import "../styles/styles.css";

export const AppNavbar = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();
  const handleLogout = () => {
    localStorage.removeItem(JWT_TOKEN_STORAGE);
    console.log("Logged out successfully.");
    showAlert("Logged out successfully", "success");
    navigate("/login");
  };
  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container>
        <Navbar.Brand href="/plants/">
          <img
            src={plantBrandIcon}
            width="40"
            height="40"
            className="d-inline-block align-top"
            alt="Brand Icon"
          />{" "}
          {APP_BRAND_NAME}
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/plants">My Plants</Nav.Link>
            <Nav.Link href="/users" className="nav-link-disabled">
              Users
            </Nav.Link>
            <Nav.Link href="/lineages" className="nav-link-disabled">
              Lineages
            </Nav.Link>
          </Nav>
          <Nav>
            <Nav.Link
              className="btn btn-outline-primary"
              onClick={handleLogout}
            >
              Logout
            </Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};
