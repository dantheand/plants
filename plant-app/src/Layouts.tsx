import { Container } from "react-bootstrap";
import { BackButton } from "./commonComponents";
import React, { ReactNode } from "react";

export const PlantLayout = ({ children }: { children: ReactNode }) => {
  return (
    <Container className="my-4">
      <BackButton />
      {children}
    </Container>
  );
};
