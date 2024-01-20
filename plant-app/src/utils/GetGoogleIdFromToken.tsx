import { JWT_TOKEN_STORAGE } from "../constants";
import { JwtPayload } from "../types/interfaces";
import { jwtDecode } from "jwt-decode";

// TODO: move all uses of this into a global context (hard because you have to handle null values)
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
