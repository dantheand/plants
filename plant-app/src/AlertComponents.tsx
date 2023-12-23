import { createContext, ReactNode, useContext, useState } from "react";
import { Alert } from "react-bootstrap";
import "./styles.css";

interface Alert {
  show: boolean;
  message: string;
  variant: string;
}

const defaultAlert: Alert = {
  show: false,
  message: "",
  variant: "",
};

interface AlertContextType {
  alert: Alert;
  showAlert: (message: string, variant: string) => void;
}

const AlertContext: React.Context<AlertContextType> = createContext({
  alert: defaultAlert,
  showAlert: (message: string, variant: string) => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<Alert>(defaultAlert);
  const showAlert = (message: string, variant: string) => {
    setAlert({ show: true, message, variant });
    setTimeout(() => setAlert({ ...alert, show: false }), 3000); // auto-hide after 3 seconds
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
