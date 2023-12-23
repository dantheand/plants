import { Container, Navbar } from "react-bootstrap";
import { BackButton } from "./commonComponents";
import React, { ReactNode } from "react";
import { AlertComponent, AlertProvider } from "./AlertComponents";
import plantBrandIcon from "./assets/plant_img_small.jpg";

import "./styles.css";

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
          Plant Tracker App
        </Navbar.Brand>
        {/* Other navbar content */}
      </Container>
    </Navbar>
  );
};

export const GlobalLayout = ({ children }: { children: ReactNode }) => {
  return (
    <AlertProvider>
      <AppNavbar />
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
