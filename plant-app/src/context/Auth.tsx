import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE, USER_ID_STORAGE } from "../constants";
import { LoadingOverlay } from "../components/authentication/LoadingOverlay";
import { getGoogleIdFromToken } from "../utils/GetGoogleIdFromToken";
import { useNavigate } from "react-router-dom";
import { CredentialResponse } from "@react-oauth/google";
import { useAlert } from "./Alerts";
import useLocalStorageState from "use-local-storage-state";

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

  const [storedUserId, setStoredUserId] = useLocalStorageState<string | null>(
    USER_ID_STORAGE,
    {
      defaultValue: null,
    },
  );

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const isAuthenticated = useMemo(() => storedUserId != null, [storedUserId]);
  const navigate = useNavigate();

  // TODO Gracefully handle cases where:
  // 1. There is no ID token
  // 2. There is no session cookie
  // 3. The session token is invalid/expired
  // Combinations of each

  const userId = useMemo(() => {
    if (storedUserId) {
      return storedUserId;
    } else {
      return undefined;
    }
  }, [storedUserId]);

  const checkAuthenticationStatus = useCallback(
    async (showLoading = false) => {
      try {
        if (showLoading) {
          setIsAuthenticating(true);
        }
        const response = await fetch(`${BASE_API_URL}/check_token`, {
          credentials: "include",
        });
        if (response.ok) {
        } else {
          setStoredUserId(null);
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        setStoredUserId(null);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [setStoredUserId],
  );

  useEffect(() => {
    // Perform an immediate check on mount
    checkAuthenticationStatus(true);

    // // Set up a timer for periodic rechecks
    // const interval = setInterval(
    //   () => {
    //     checkAuthenticationStatus();
    //   },
    //   10 * 60 * 1000,
    // ); // Recheck every 10 minutes,
    //
    // // Cleanup interval on component unmount
    // return () => clearInterval(interval);
  }, [checkAuthenticationStatus]);

  const login = async (
    googleOauthResponse: CredentialResponse,
    nonce: string,
  ) => {
    try {
      setIsAuthenticating(true);
      const tokenId = googleOauthResponse.credential;
      const res = await fetch(BASE_API_URL + "/token", {
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
      setStoredUserId(userIdFromToken);
      showAlert("Successfully logged in!", "success");
      navigate(`/plants/user/me`);
    } catch (error) {
      console.error("Error authenticating with backend:", error);
      setStoredUserId(null);
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
        setStoredUserId(null);
        localStorage.removeItem(JWT_TOKEN_STORAGE);
        console.log("logged out");
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
