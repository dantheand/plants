import { Card } from "react-bootstrap";
import {
  APP_BRAND_NAME,
  BASE_API_URL,
  GOOGLE_CLIENT_ID,
  JWT_TOKEN_STORAGE,
} from "../../constants";
import { useNavigate } from "react-router-dom";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect } from "react";
import logo from "../../assets/plantopticon2_large_no_shadow.png";
import cryptoRandomString from "crypto-random-string";
import { LoadingOverlay } from "./LoadingOverlay";
import { getGoogleIdFromToken } from "../../utils/GetGoogleIdFromToken";

function generateNonce(length = 32) {
  return cryptoRandomString({ length: length, type: "hex" });
}

async function responseGoogle(
  response: CredentialResponse,
  nonce: string,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
  setIsAuthenticating: React.Dispatch<React.SetStateAction<boolean>>,
) {
  try {
    setIsAuthenticating(true);
    const tokenId = response.credential;
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
    // TODO: figure out if we should set google ID here or somewhere else;
    //   Probably want to remove JWT token entirely since it expires and session state is stored in the backend instead
    localStorage.setItem(JWT_TOKEN_STORAGE, data);

    setIsLoggedIn(true);
  } catch (error) {
    console.error("Error authenticating with backend:", error);
  } finally {
    setIsAuthenticating(false);
  }
}
export function AuthFromFrontEnd() {
  const nonce = generateNonce();
  const [isAuthenticating, setIsAuthenticating] = React.useState(false);
  // TODO: switch this to the isAuthenticated global context variable
  // And redirect to plants if user is already logged in
  // const { setIsAuthenticated } = useAuth(); // Use the useAuth hook to get setIsAuthenticated
  // const { setIsAuthenticating } = useAuth(); // Use the useAuth hook to get setIsAuthenticating
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);

  // TODO: set the isAuthenticated global context variable instead of isLoggedIn
  const handleGoogleSuccess = (response: CredentialResponse) => {
    responseGoogle(response, nonce, setIsLoggedIn, setIsAuthenticating);
  };

  const navigate = useNavigate();
  // Redirect if logged in
  useEffect(() => {
    if (isLoggedIn) {
      const currentUserId = getGoogleIdFromToken();
      navigate(`/plants/user/${currentUserId}`);
    }
  }, [isLoggedIn, navigate]);
  return (
    <>
      {isAuthenticating && <LoadingOverlay loadingText={"Authenticating..."} />}{" "}
      <div className="centered-container">
        <Card className="auth-card">
          <div style={{ textAlign: "center" }}>
            <img
              src={logo}
              alt={`${APP_BRAND_NAME} Logo`}
              className="auth-logo"
            />
            <h2>{APP_BRAND_NAME}</h2>
          </div>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} nonce={nonce}>
            <div className="auth-form-group">
              <GoogleLogin
                nonce={nonce}
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  console.log("Login Failed");
                }}
              />
            </div>
          </GoogleOAuthProvider>
        </Card>
      </div>
    </>
  );
}
