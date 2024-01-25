import { Spinner } from "react-bootstrap";

export const LoadingOverlay = () => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner animation="border" variant="light" />
        <p>Authenticating...</p>
      </div>
    </div>
  );
};
