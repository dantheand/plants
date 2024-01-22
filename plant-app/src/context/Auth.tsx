import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { BASE_API_URL } from "../constants";

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

// Provide a default value matching the AuthContextType
const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {}, // No-op function as a placeholder
});

// This URL should point to your backend endpoint that validates the session or token
const SESSION_VALIDATION_URL = `${BASE_API_URL}/check_token`;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Function to check authentication status
  const checkAuthenticationStatus = async () => {
    try {
      const response = await fetch(SESSION_VALIDATION_URL, {
        method: "GET",
        credentials: "include", // Important for cookies to be sent and received
        headers: {
          "Content-Type": "application/json",
        },
      });
      // Update state based on the response
      setIsAuthenticated(response.ok && (await response.json()));
    } catch (error) {
      console.error("Error checking authentication status:", error);
      setIsAuthenticated(false);
    }
  };

  useEffect(() => {
    // Perform an immediate check
    checkAuthenticationStatus();

    // Set up a timer for periodic rechecks
    const intervalId = setInterval(
      () => {
        checkAuthenticationStatus();
      },
      5 * 60 * 1000,
    ); // Recheck every 5 minutes,

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
