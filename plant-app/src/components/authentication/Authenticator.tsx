import { Button, Card, Toast, ToastContainer } from "react-bootstrap";
import { APP_BRAND_NAME, GOOGLE_CLIENT_ID } from "../../constants";
import { useNavigate } from "react-router-dom";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";
import React, { useEffect, useMemo, useState } from "react";
import logo from "../../assets/plantopticon2_large_no_shadow.png";
import cryptoRandomString from "crypto-random-string";
import { useAuth } from "../../context/Auth";

function generateNonce(length = 32) {
  return cryptoRandomString({ length: length, type: "hex" });
}

export function AuthFromFrontEnd() {
  // TODO figure out how to make this nonce only once per session authentication attempt
  const nonce = useMemo(() => {
    return generateNonce();
  }, []);

  // And redirect to plants if user is already logged in
  const { login, isAuthenticated } = useAuth(); // Use the useAuth hook to get setIsAuthenticated
  const [showCreateAccountToast, setShowCreateAccountToast] = useState(false); // State to control Toast visibility

  const handleGoogleSuccess = (response: CredentialResponse) => {
    login(response, nonce);
  };

  const toggleShowToast = () =>
    setShowCreateAccountToast(!showCreateAccountToast);

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
            <h2 className="mb-3">{APP_BRAND_NAME}</h2>
          </div>
          <hr />
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
          <Button
            variant="link"
            className={"create-account-button"}
            onClick={toggleShowToast}
          >
            Create Account
          </Button>
        </Card>
        {/* Toast for displaying the message */}
        <ToastContainer position={"bottom-center"} className={"mb-3"}>
          <Toast show={showCreateAccountToast} onClose={toggleShowToast}>
            <Toast.Header>
              <strong className="me-auto">New Account Information</strong>
            </Toast.Header>
            <Toast.Body>
              <p>Interested in beta testing?</p>
              <ol>
                <li>
                  Create a new account by trying to log in with your Google
                  account.
                </li>
                <li>Ask Dan to enable your account.</li>
              </ol>
            </Toast.Body>
          </Toast>
        </ToastContainer>
      </div>
    </>
  );
}
