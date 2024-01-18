import { Container, Nav, Navbar } from "react-bootstrap";
import plantBrandIcon from "../assets/plant_logo_leaf_only_small.png";
import { APP_BRAND_NAME, JWT_TOKEN_STORAGE } from "../constants";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAlert } from "../context/Alerts"; // Assuming you are using react-router

import "../styles/styles.css";
import { FaRightFromBracket } from "react-icons/fa6";

export const AppNavbar = () => {
  const navigate = useNavigate();
  const { showAlert } = useAlert();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  const handleLogout = () => {
    localStorage.removeItem(JWT_TOKEN_STORAGE);
    console.log("Logged out successfully.");
    showAlert("Logged out successfully", "success");
    navigate("/login");
  };
  return (
    <Navbar className="justify-content-between">
      <Container>
        <Navbar.Brand
          className="cursor-on-hover"
          onClick={() => handleNavigate("/plants")}
        >
          <img
            src={plantBrandIcon}
            width="40"
            height="40"
            className="d-inline-block align-top"
            alt="Brand Icon"
          />
          <span className="d-none d-lg-inline"> {APP_BRAND_NAME}</span>
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link onClick={() => handleNavigate("/plants")}>Plants</Nav.Link>
          <Nav.Link onClick={() => handleNavigate("/users")}>Users</Nav.Link>
          <Nav.Link
            onClick={() => handleNavigate("/lineages")}
            className="nav-link-disabled"
          >
            Lineages
          </Nav.Link>
        </Nav>
        <Nav className="ms-auto">
          <Nav.Link className="hoverable-icon" onClick={handleLogout}>
            <FaRightFromBracket />
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};
