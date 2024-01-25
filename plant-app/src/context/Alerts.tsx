import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
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

const getTimeOutLength = (variant: string) => {
  if (variant === "danger") {
    return 10000;
  } else if (variant === "success") {
    return 3000;
  } else {
    return 5000;
  }
};

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alert, setAlert] = useState<AlertProps>(defaultAlert);
  const showAlert = useCallback((message: string, variant: string) => {
    setAlert(() => ({ show: true, message, variant }));
    setTimeout(
      () => setAlert((currentAlert) => ({ ...currentAlert, show: false })),
      getTimeOutLength(variant),
    );
  }, []);
  return (
    <AlertContext.Provider value={{ alert, showAlert }}>
      <AlertComponent />
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
