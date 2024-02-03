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
            style={{ marginBottom: "0px" }} // Keeps image aligned
          />
          {/* Need to wrap the text in a div and apply styles to move it down */}
          <div
            style={{ marginLeft: "0.5rem", position: "relative", top: "6px" }}
          >
            <span className="d-none d-lg-inline text-secondary-emphasis">
              {APP_BRAND_NAME}
            </span>
          </div>
        </Navbar.Brand>
        <Nav className="me-auto mt-3">
          <Nav.Link
            className={isActive(`/plants`) ? "active" : ""}
            onClick={() => handleNavigate(`plants/user/me`)}
          >
            <FaSeedling className={"nav-icon"} />
            <span className="d-none d-lg-inline ml-2"> Plants</span>
          </Nav.Link>
          <Nav.Link
            className={isActive(`/users`) ? "active" : ""}
            onClick={() => handleNavigate("/users")}
          >
            <FaUsers className={"nav-icon"} />
            <span className="d-none d-lg-inline"> Users</span>
          </Nav.Link>
          <Nav.Link
            className={isActive(`/lineages`) ? "active" : ""}
            onClick={() => handleNavigate("/lineages/user/me")}
          >
            <FaProjectDiagram className={"nav-icon"} />
            <span className="d-none d-lg-inline"> Lineages</span>
          </Nav.Link>
        </Nav>
        <Nav className="ms-auto">
          <Nav.Link className="hoverable-icon" onClick={logout}>
            <FaRightFromBracket className="logout-btn" />
          </Nav.Link>
        </Nav>
      </Container>
    </Navbar>
  );
};
