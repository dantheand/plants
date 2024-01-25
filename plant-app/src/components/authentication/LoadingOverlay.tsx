import { Spinner } from "react-bootstrap";

interface LoadingOverlayProps {
  loadingText: string;
}

export const LoadingOverlay = ({ loadingText }: LoadingOverlayProps) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner animation="border" variant="light" />
        <p>{loadingText}</p>
      </div>
    </div>
  );
};
