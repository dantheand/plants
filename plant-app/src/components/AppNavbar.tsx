import { Container, Nav, Navbar } from "react-bootstrap";
import plantBrandIcon from "../assets/plantopticon2_small.png";
import { APP_BRAND_NAME } from "../constants";
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/styles.scss";
import { FaRightFromBracket } from "react-icons/fa6";
import { useAuth } from "../context/Auth";
import { useAlert } from "../context/Alerts";

export const AppNavbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showAlert } = useAlert();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <Navbar className="justify-content-between">
      <Container>
        <Navbar.Brand
          className="cursor-on-hover"
          onClick={() => handleNavigate("/plants/user/me")}
        >
          <img
            className="mb-3"
            src={plantBrandIcon}
            width="45"
            height="45"
            alt="Plantopticon Icon"
          />
          <span className="d-none d-lg-inline"> {APP_BRAND_NAME}</span>
        </Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link onClick={() => handleNavigate(`plants/user/me`)}>
            Plants
          </Nav.Link>
          <Nav.Link onClick={() => handleNavigate("/users")}>Users</Nav.Link>
          <Nav.Link
            // onClick={() => handleNavigate("/lineages")}
            onClick={() => showAlert('Coming "soon"', "secondary")}
          >
            Lineages
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
