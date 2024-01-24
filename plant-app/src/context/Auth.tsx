import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE, USER_ID_STORAGE } from "../constants";
import { LoadingOverlay } from "../components/authentication/LoadingOverlay";
import { getGoogleIdFromToken } from "../utils/GetGoogleIdFromToken";
import { useNavigate } from "react-router-dom";
import { CredentialResponse } from "@react-oauth/google";
import { useAlert } from "./Alerts";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (googleOauthResponse: CredentialResponse, nonce: string) => void; // Define how login is handled
  logout: () => void; // Define how logout is handled
  userId: string | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { showAlert } = useAlert();

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // TODO Gracefully handle cases where:
  // 1. There is no JWT token
  // 2. There is no session cookie
  // Combinations of each

  // If there isnt a userID set, we may be in a fresh session, so try to extract it from local storage
  useEffect(() => {
    if (!userId) {
      const extractedUserId = localStorage.getItem(USER_ID_STORAGE);
      if (extractedUserId) {
        setUserId(extractedUserId);
      } else {
        setIsAuthenticated(false);
      }
    }
  }, [userId]);

  // Function to check authentication status
  const checkAuthenticationStatus = async (showLoading = false) => {
    // Implement call to /check_token endpoint
    // This example assumes fetch is wrapped to handle HTTP-only cookie automatically
    try {
      if (showLoading) {
        setIsAuthenticating(true);
      }
      const response = await fetch(`${BASE_API_URL}/check_token`, {
        credentials: "include",
      });
      if (response.ok) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("userId");
        setUserId(undefined);
      }
    } catch (error) {
      console.error("Error checking authentication status:", error);
      setIsAuthenticated(false);
      localStorage.removeItem("userId");
      setUserId(undefined);
    } finally {
      setIsAuthenticating(false);
    }
  };

  useEffect(() => {
    // Perform an immediate check on mount
    checkAuthenticationStatus(true);

    // Set up a timer for periodic rechecks
    const interval = setInterval(
      () => {
        checkAuthenticationStatus();
      },
      5 * 60 * 1000,
    ); // Recheck every 5 minutes,

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  const login = async (
    googleOauthResponse: CredentialResponse,
    nonce: string,
  ) => {
    try {
      setIsAuthenticating(true);
      const tokenId = googleOauthResponse.credential;
      const backendUrl = BASE_API_URL + "/token";
      const res = await fetch(backendUrl, {
        method: "POST",
        credentials: "include", // This is important for cookies to be sent and received
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokenId, nonce: nonce }),
      });

      const data = await res.json();
      // TODO: just store the userID in local storage rather than a token (change API return)
      localStorage.setItem(JWT_TOKEN_STORAGE, data);
      const userIdFromToken = getGoogleIdFromToken();
      setUserId(userIdFromToken);
      if (userIdFromToken) {
        localStorage.setItem(USER_ID_STORAGE, userIdFromToken);
      }
      setIsAuthenticated(true);
      showAlert("Successfully logged in!", "success");
      navigate(`/plants/user/me`);
    } catch (error) {
      console.error("Error authenticating with backend:", error);
      setIsAuthenticated(false);
      showAlert("Error authenticating with backend", "danger");
    } finally {
      setIsAuthenticating(false);
    }
  };

  const logout = async () => {
    try {
      const response = await fetch(BASE_API_URL + "/logout", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem(JWT_TOKEN_STORAGE);
        localStorage.removeItem(USER_ID_STORAGE);
        console.log("logged out");
        setIsAuthenticated(false);
        setUserId(undefined);
        navigate("/login");
      } else {
        // Handle server-side errors (e.g., session not found)
        const errorText = await response.text();
        console.log(`Logout failed: ${errorText}`);
      }
    } catch (error) {
      console.log(`Logout error: ${error}`);
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, userId }}>
      {isAuthenticating && <LoadingOverlay loadingText={"Authenticating..."} />}
      {children}
    </AuthContext.Provider>
  );
};

// Prevent unset context from being used downstream
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};