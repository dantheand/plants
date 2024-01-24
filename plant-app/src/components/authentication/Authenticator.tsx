import { Card } from "react-bootstrap";
import { APP_BRAND_NAME, GOOGLE_CLIENT_ID } from "../../constants";
import { useNavigate } from "react-router-dom";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect } from "react";
import logo from "../../assets/plantopticon2_large_no_shadow.png";
import cryptoRandomString from "crypto-random-string";
import { useAuth } from "../../context/Auth";

function generateNonce(length = 32) {
  return cryptoRandomString({ length: length, type: "hex" });
}

export function AuthFromFrontEnd() {
  const nonce = generateNonce();

  // And redirect to plants if user is already logged in
  const { login, isAuthenticated } = useAuth(); // Use the useAuth hook to get setIsAuthenticated

  const handleGoogleSuccess = (response: CredentialResponse) => {
    login(response, nonce);
  };

  const navigate = useNavigate();
  // Redirect if logged in
  useEffect(() => {
    if (isAuthenticated) {
      navigate(`/plants/user/me`);
    }
  }, [isAuthenticated, navigate]);
  return (
    <>
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
