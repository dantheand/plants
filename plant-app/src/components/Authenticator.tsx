import "@aws-amplify/ui-react/styles.css";
import { Alert, Button, Card, Form } from "react-bootstrap";
import {
  APP_BRAND_NAME,
  BASE_API_URL,
  GOOGLE_CLIENT_ID,
  JWT_TOKEN_STORAGE,
} from "../constants";
import { useNavigate } from "react-router-dom";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect } from "react";
import logo from "../assets/plant_logo_big.png";
import { jwtDecode } from "jwt-decode";
import { LOG_OUT_GOOGLE_ID } from "../featureFlags";

function generateNonce(length = 32) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(
      Math.floor(
        (crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) *
          charactersLength,
      ),
    );
  }
  return result;
}

async function responseGoogle(
  response: CredentialResponse,
  nonce: string,
  setIsLoggedIn: React.Dispatch<React.SetStateAction<boolean>>,
) {
  try {
    const tokenId = response.credential;
    if (tokenId && LOG_OUT_GOOGLE_ID) {
      try {
        const decodedToken = jwtDecode(tokenId);
        console.log(decodedToken);
      } catch (error) {
        console.error("Failed to decode token", error);
      }
    }
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
    localStorage.setItem(JWT_TOKEN_STORAGE, data);
    setIsLoggedIn(true);
  } catch (error) {
    console.error("Error authenticating with backend:", error);
  }
}
export function AuthFromFrontEnd() {
  const nonce = generateNonce();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const handleLogout = () => {
    localStorage.removeItem(JWT_TOKEN_STORAGE);
    console.log("Logged out successfully.");
  };

  const handleGoogleSuccess = (response: CredentialResponse) => {
    responseGoogle(response, nonce, setIsLoggedIn);
  };

  // If we're logged in, redirect to the plants page
  const navigate = useNavigate();
  // Redirect if logged in
  useEffect(() => {
    if (isLoggedIn) {
      navigate("/plants/");
    }
  }, [isLoggedIn, navigate]);
  return (
    <Card style={{ width: "18rem", padding: "20px", margin: "20px auto" }}>
      <div style={{ textAlign: "center" }}>
        <img
          src={logo}
          alt={`${APP_BRAND_NAME} Logo`}
          style={{ width: "200px", margin: "10px auto" }}
        />
        <h2>{APP_BRAND_NAME}</h2>
      </div>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} nonce={nonce}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "10px",
            marginTop: "10px",
          }}
        >
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
  );
}

export function Logout() {
  const handleLogout = () => {
    localStorage.removeItem(JWT_TOKEN_STORAGE);
    console.log("Logged out successfully.");
  };
  return (
    <Card style={{ width: "18rem", padding: "20px", margin: "20px auto" }}>
      <Button
        onClick={() => handleLogout()}
        variant="secondary"
        style={{ marginTop: "10px" }}
      >
        Logout
      </Button>
    </Card>
  );
}
