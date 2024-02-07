import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import plantBrandIcon from "../assets/plantopticon2_small.png";
import { APP_BRAND_NAME } from "../constants";
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/styles.scss";
import { FaRightFromBracket } from "react-icons/fa6";
import { useAuth } from "../context/Auth";
import {
  FaBars,
  FaCog,
  FaProjectDiagram,
  FaSeedling,
  FaUserCog,
  FaUsers,
} from "react-icons/fa";

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
          <DropDownMenu logout={logout} lg_screen={false} />
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
        <Nav className="ms-auto d-none d-lg-flex">
          <DropDownMenu logout={logout} lg_screen={true} />
        </Nav>
      </Container>
    </Navbar>
  );
};

const DropDownMenu = ({
  logout,
  lg_screen,
}: {
  logout: () => void;
  lg_screen: boolean;
}) => {
  return (
    <NavDropdown
      title={<FaBars className="nav-icon" />}
      id="nav-dropdown"
      className={`navbar-dropdown ${lg_screen ? "large-menu" : ""}`}
      align={"end"}
    >
      <NavDropdown.Item onClick={() => console.log("Navigate to settings")}>
        <FaCog size={15} className={"mx-2"} /> Settings
      </NavDropdown.Item>
      <NavDropdown.Item onClick={logout}>
        <FaRightFromBracket size={15} className={"mx-2"} /> Logout
      </NavDropdown.Item>
    </NavDropdown>
  );
};
