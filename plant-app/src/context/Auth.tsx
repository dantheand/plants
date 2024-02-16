import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "../constants";
import { LoadingOverlay } from "../components/authentication/LoadingOverlay";
import { useNavigate } from "react-router-dom";
import { CredentialResponse } from "@react-oauth/google";
import { useAlert } from "./Alerts";
import useLocalStorageState from "use-local-storage-state";
import { useApi } from "../utils/api";

import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "../types/interfaces";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (googleOauthResponse: CredentialResponse, nonce: string) => void;
  logout: () => void;
  userId: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { showAlert } = useAlert();

  const [storedJwt, setstoredJwt] = useLocalStorageState<string | null>(
    JWT_TOKEN_STORAGE,
    {
      defaultValue: null,
    },
  );

  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const isAuthenticated = useMemo(() => storedJwt != null, [storedJwt]);
  const navigate = useNavigate();
  const { callApi } = useApi();

  const userId = useMemo(() => {
    if (storedJwt) {
      const decodedToken: JwtPayload = jwtDecode(storedJwt);
      return decodedToken.google_id;
    } else {
      return null;
    }
  }, [storedJwt]);

  const checkAuthenticationStatus = useCallback(
    async (showLoadingOverlay = false) => {
      if (!storedJwt) {
        return;
      }
      try {
        if (showLoadingOverlay) {
          setIsAuthenticating(true);
        }
        const response = await fetch(`${BASE_API_URL}/check_token`, {
          headers: {
            Authorization: `Bearer ${storedJwt}`,
          },
        });
        if (!response.ok) {
          showAlert("Session expired. Please log in again.", "danger");
          setstoredJwt(null);
        }
      } catch (error) {
        console.error("Error checking authentication status:", error);
        setstoredJwt(null);
      } finally {
        setIsAuthenticating(false);
      }
    },
    //   TODO: figure out why we can't use callApi here (it results in a rerun of the effect on page navigation)
    [setstoredJwt, storedJwt, showAlert],
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
      const response = await fetch(BASE_API_URL + "/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: tokenId, nonce: nonce }),
      });

      const data = await response.json();

      setstoredJwt(data.token);
      showAlert("Logged in!", "success");
      navigate(`/plants/user/me`);
    } catch (error) {
      console.error("Error authenticating with backend:", error);
      setstoredJwt(null);
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
        setstoredJwt(null);
        showAlert("Logged out!", "success");
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
