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

  // Function to determine if the link is active
  const isActive = (path: string): boolean =>
    location.pathname.startsWith(path);

  return (
    <Navbar className="justify-content-between navbar-custom">
      <Container className={"m-0"}>
        <Navbar.Brand
          className="cursor-on-hover pb-0 mb-1"
          onClick={() => handleNavigate("/plants/user/me")}
        >
          <img
            src={plantBrandIcon}
            width="45"
            height="45"
            alt="Plantopticon Icon"
          />
          <span className="d-none d-lg-inline pt-3"> {APP_BRAND_NAME}</span>
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
