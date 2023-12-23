import { Container } from "react-bootstrap";
import { BackButton } from "./commonComponents";
import React, { ReactNode } from "react";
import { AlertComponent, AlertProvider } from "./AlertComponents";

export const GlobalLayout = ({ children }: { children: ReactNode }) => {
  return (
    <AlertProvider>
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
