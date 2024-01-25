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
import { useApi } from "../utils/api";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (googleOauthResponse: CredentialResponse, nonce: string) => void;
  logout: () => void;
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
  const { callApi } = useApi();

  const userId = useMemo(() => {
    if (storedUserId) {
      return storedUserId;
    } else {
      return undefined;
    }
  }, [storedUserId]);

  const checkAuthenticationStatus = useCallback(
    async (showLoadingOverlay = false) => {
      try {
        if (showLoadingOverlay) {
          setIsAuthenticating(true);
        }
        const response = await fetch(`${BASE_API_URL}/check_token`);
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
    //   TODO: figure out why we can't use callApi here (it results in a rerun of the effect on page navigation)
    [setStoredUserId],
  );

  useEffect(() => {
    // Perform an immediate check on initial mount
    checkAuthenticationStatus(true);

    // TODO: implement some sort of polling to check authentication status and navigate to login if not authenticated
    // You can query the backend with a GET request to /check_token
  }, [checkAuthenticationStatus]);

  const login = async (
    googleOauthResponse: CredentialResponse,
    nonce: string,
  ) => {
    try {
      setIsAuthenticating(true);
      const tokenId = googleOauthResponse.credential;
      const res = await callApi(BASE_API_URL + "/token", {
        method: "POST",
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
      const response = await callApi(BASE_API_URL + "/logout", {
        method: "GET",
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
