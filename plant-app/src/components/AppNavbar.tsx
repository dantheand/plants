import { Container, Nav, Navbar } from "react-bootstrap";
import plantBrandIcon from "../assets/plantopticon2_small.png";
import { APP_BRAND_NAME } from "../constants";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/styles.scss";
import { FaRightFromBracket } from "react-icons/fa6";
import { useAuth } from "../context/Auth";
import { FaProjectDiagram, FaSeedling, FaUsers } from "react-icons/fa";

export const AppNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const location = useLocation(); // Use the hook here
  const handleNavigate = (path: string) => {
    navigate(path);
  };

  // Function to determine if the path is active to highlight the navbar link
  const isActive = (path: string): boolean =>
    location.pathname.startsWith(path);

  return (
    <Navbar className="justify-content-between navbar-custom">
      <Container>
        <Navbar.Brand
          className="cursor-on-hover"
          onClick={() => handleNavigate("/plants/user/me")}
          style={{ display: "flex", alignItems: "center" }}
        >
          <img
            src={plantBrandIcon}
            width="45"
            height="45"
            alt="Plantopticon Icon"
            style={{ marginBottom: "0px" }}
          />
          <div
            style={{ marginLeft: "0.5rem", position: "relative", top: "6px" }}
          >
            <span className="d-none d-lg-inline text-secondary-emphasis navbar-brand-text">
              {APP_BRAND_NAME}
            </span>
          </div>
        </Navbar.Brand>
        {/*TODO: deduplicate the small screen and large screen links code*/}
        {/*On smaller screens, evenly distribute navbar links*/}
        <div className="d-flex justify-content-around w-100 d-lg-none small-nav-link-container">
          {/* Navbar links for smaller screens */}
          <Nav.Link
            className={isActive("/plants") ? "active" : ""}
            onClick={() => handleNavigate("plants/user/me")}
          >
            <FaSeedling className="nav-icon" />
          </Nav.Link>
          <Nav.Link
            className={isActive("/users") ? "active" : ""}
            onClick={() => handleNavigate("/users")}
          >
            <FaUsers className="nav-icon" />
          </Nav.Link>
          <Nav.Link
            className={isActive("/lineages") ? "active" : ""}
            onClick={() => handleNavigate("/lineages/user/me")}
          >
            <FaProjectDiagram className="nav-icon" />
          </Nav.Link>
          {/* Logout button for smaller screens */}
          <Nav.Link className="hoverable-icon" onClick={logout}>
            <FaRightFromBracket className="nav-icon text-danger" />
          </Nav.Link>
        </div>
        {/* On larger screens, left justify and spell out labels */}
        <Nav className="me-auto mt-3 d-none d-lg-flex">
          <Nav.Link
            className={isActive("/plants") ? "active" : ""}
            onClick={() => handleNavigate("plants/user/me")}
          >
            <FaSeedling className="nav-icon" />
            <span> Plants</span>
          </Nav.Link>
          <Nav.Link
            className={isActive("/users") ? "active" : ""}
            onClick={() => handleNavigate("/users")}
          >
            <FaUsers className="nav-icon" />
            <span> Users</span>
          </Nav.Link>
          <Nav.Link
            className={isActive("/lineages") ? "active" : ""}
            onClick={() => handleNavigate("/lineages/user/me")}
          >
            <FaProjectDiagram className="nav-icon" />
            <span> Lineages</span>
          </Nav.Link>
        </Nav>
        {/* Logout button for larger screens, adjust as necessary */}
        <Nav className="ms-auto d-none d-lg-flex">
          <Nav.Link className="hoverable-icon" onClick={logout}>
            <FaRightFromBracket className="logout-btn text-danger" />
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};
