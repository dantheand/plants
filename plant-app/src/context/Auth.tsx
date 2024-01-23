import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { BASE_API_URL } from "../constants";
import { LoadingOverlay } from "../components/authentication/LoadingOverlay";
import { getGoogleIdFromToken } from "../utils/GetGoogleIdFromToken";

interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  userId: string;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  setIsAuthenticated: () => {}, // No-op function as a placeholder
  userId: "",
});

const SESSION_VALIDATION_URL = `${BASE_API_URL}/check_token`;

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [userId, setUserId] = useState<string>("");

  // Check if there is a JWT token and set the user ID from it, otherwise set auth to false
  useEffect(() => {
    try {
      const extractedUserId = getGoogleIdFromToken();
      if (extractedUserId) {
        setUserId(extractedUserId);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error("Error extracting user ID from token:", error);
      setIsAuthenticated(false);
    }
  }, []);

  // Function to check authentication status
  const checkAuthenticationStatus = async () => {
    try {
      const response = await fetch(SESSION_VALIDATION_URL, {
        method: "GET",
        credentials: "include", // Required for cookies to be sent and received
        headers: {
          "Content-Type": "application/json",
        },
      });
      setIsAuthenticated(response.ok && (await response.json()));
      // TODO: probably change check_token to return user ID so we can store it in the global context
    } catch (error) {
      console.error("Error checking authentication status:", error);
      setIsAuthenticated(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    // Perform an immediate check on mount
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

  // TODO: probably combine the login page isauthentcating and this isauthenticating
  if (isAuthenticating) {
    return <LoadingOverlay loadingText={"Checking..."} />;
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, setIsAuthenticated, userId }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);
