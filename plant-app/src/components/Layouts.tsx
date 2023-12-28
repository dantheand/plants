import { Container } from "react-bootstrap";
import { BackButton, FloatingActionButton } from "./CommonComponents";
import React, { ReactNode } from "react";
import { AlertComponent, AlertProvider } from "../context/Alerts";

import "../styles/styles.css";
import { useLocation } from "react-router-dom";
import { AppNavbar } from "./AppNavbar";
import { FaPlus } from "react-icons/fa";
import { FaCamera } from "react-icons/fa6";

export const GlobalLayout = ({ children }: { children: ReactNode }) => {
  // Exclude the navbar from the login page
  const location = useLocation();
  const isLoginPage =
    location.pathname === "/login" ||
    location.pathname === "/" ||
    location.pathname === "/logout";

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
      <BackButton /> {children}
      <FloatingActionButton
        icon={<FaCamera />}
        handleOnClick={() => console.log("Clicked!")}
      />
    </Container>
  );
};
