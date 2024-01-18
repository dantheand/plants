import { Container } from "react-bootstrap";
import React, { ReactNode } from "react";
import { AlertComponent, AlertProvider } from "../context/Alerts";

import "../styles/styles.css";
import { useLocation } from "react-router-dom";
import { AppNavbar } from "./AppNavbar";
import Footer from "./Footer";

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
      <Footer />
    </AlertProvider>
  );
};

export const BaseLayout = ({ children }: { children: ReactNode }) => {
  return <Container className="my-2">{children}</Container>;
};
