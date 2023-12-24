import { Container, Navbar } from "react-bootstrap";
import { BackButton } from "./commonComponents";
import React, { ReactNode } from "react";
import { AlertComponent, AlertProvider } from "./AlertComponents";
import plantBrandIcon from "./assets/plant_logo_leaf_only_small.png";

import "./styles.css";
import { useLocation } from "react-router-dom";
import { APP_BRAND_NAME } from "./constants";

export const AppNavbar = () => {
  return (
    <Navbar expand="lg" className="custom-navbar">
      <Container>
        <Navbar.Brand href="/plants/">
          <img
            src={plantBrandIcon}
            width="40" // Adjust size as needed
            height="40"
            className="d-inline-block align-top"
            alt="Brand Icon"
          />{" "}
          {APP_BRAND_NAME}
        </Navbar.Brand>
        {/* Other navbar content */}
      </Container>
    </Navbar>
  );
};

export const GlobalLayout = ({ children }: { children: ReactNode }) => {
  // Exclude the navbar from the login page
  const location = useLocation();
  const isLoginPage =
    location.pathname === "/login" || location.pathname === "/logout";

  return (
    <AlertProvider>
      {!isLoginPage && <AppNavbar />}
      <AlertComponent />
      {children}
    </AlertProvider>
  );
};

export const PlantLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Container className="my-4">
      <BackButton />{" "}
      {/*TODO: Either use context API to pass this info to DeleteButton, put the component in plantdetails,
      or raise the state*/}
      {children}
    </Container>
  );
};
