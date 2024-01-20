import { createContext, ReactNode, useContext, useState } from "react";
import { Alert } from "react-bootstrap";
import "../styles/styles.scss";
import { Variant } from "react-bootstrap/types";

interface AlertProps {
  show: boolean;
  message: string;
  variant: Variant;
}

const defaultAlert: AlertProps = {
  show: false,
  message: "",
  variant: "info",
};

interface AlertContextType {
  alert: AlertProps;
  showAlert: (message: string, variant: string) => void;
}

const AlertContext: React.Context<AlertContextType> = createContext({
  alert: defaultAlert,
  showAlert: (message: string, variant: string) => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertProps>(defaultAlert);
  const showAlert = (message: string, variant: string) => {
    setAlert({ show: true, message, variant });
    /* TODO: extend error alert time */
    setTimeout(() => setAlert({ ...alert, show: false }), 10000); // auto-hide after 10 seconds
  };
  return (
    <AlertContext.Provider value={{ alert, showAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export const AlertComponent = () => {
  const { alert } = useAlert();
  return (
    <div className="alert-popup">
      {alert.show && (
        <Alert variant={alert.variant} dismissible>
          {alert.message}
        </Alert>
      )}
    </div>
  );
};
