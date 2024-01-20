import React, { createContext, ReactNode, useEffect, useState } from "react";
import { JWT_TOKEN_STORAGE } from "../constants";
import { JwtPayload } from "../types/interfaces";
import { jwtDecode } from "jwt-decode";
import { useAlert } from "./Alerts";
import { useNavigate } from "react-router-dom";

export const getGoogleIdFromToken = (): string | null => {
  let google_id: string | null = null;

  const token = localStorage.getItem(JWT_TOKEN_STORAGE);
  if (token) {
    const decoded: JwtPayload = jwtDecode<JwtPayload>(token);
    google_id = decoded.google_id;
  }

  if (!google_id) {
    console.error("Google ID not found in token");
  }
  return google_id;
};
interface UserContextType {
  currentUserId: string;
}

// Providing a default context value
const defaultContextValue: UserContextType = {
  currentUserId: "",
};

export const UserContext = createContext<UserContextType>(defaultContextValue);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  useEffect(() => {
    const userId = getGoogleIdFromToken();
    if (userId) {
      setCurrentUserId(userId);
    } else {
      console.error("Google ID not found in token");
      showAlert("Google ID not found in token", "danger");
      navigate("/login");
    }
  }, []);

  // Render children only when not loading and currentUserId is available
  if (currentUserId === "") {
    return <div>Loading user data...</div>; // Or any other loading indicator
  }
  return (
    <UserContext.Provider value={{ currentUserId }}>
      {children}
    </UserContext.Provider>
  );
};
