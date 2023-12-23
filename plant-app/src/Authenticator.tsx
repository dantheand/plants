import "@aws-amplify/ui-react/styles.css";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { BASE_API_URL, GOOGLE_CLIENT_ID, JWT_TOKEN_STORAGE } from "./constants";
import { useNavigate } from "react-router-dom";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect } from "react";
import { useAlert } from "./AlertComponents";

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
    const backendUrl = BASE_API_URL + "/token";
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: tokenId, nonce: nonce }),
    });

    const data = await res.json();
    localStorage.setItem(JWT_TOKEN_STORAGE, data);
    setIsLoggedIn(true);
    console.log("Logged in successfully");
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
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID} nonce={nonce}>
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: "10px",
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
