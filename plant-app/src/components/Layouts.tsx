import { Container } from "react-bootstrap";
import React, { ReactNode } from "react";

import "../styles/styles.scss";
import { useLocation } from "react-router-dom";
import { AppNavbar } from "./AppNavbar";
import Footer from "./Footer";
import { AlertComponent } from "../context/Alerts";

export const GlobalLayout = ({ children }: { children: ReactNode }) => {
  // Exclude the navbar from the login page
  const location = useLocation();
  const isLoginPage =
    location.pathname === "/login" ||
    location.pathname === "/" ||
    location.pathname === "/logout";

  return (
    <div>
      {!isLoginPage && <AppNavbar />}
      <AlertComponent />
      {children}
      <Footer />
    </div>
  );
};

export const BaseLayout = ({ children }: { children: ReactNode }) => {
  return <Container className="my-2">{children}</Container>;
};
