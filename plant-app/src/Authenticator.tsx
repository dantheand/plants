import "@aws-amplify/ui-react/styles.css";
import { Alert, Button, Card, Form } from "react-bootstrap";
import { FormEvent, useState } from "react";
import { BASE_API_URL, GOOGLE_CLIENT_ID, JWT_TOKEN_STORAGE } from "./constants";
import { useNavigate } from "react-router-dom";
import { CredentialResponse, GoogleLogin } from "@react-oauth/google";
import { GoogleOAuthProvider } from "@react-oauth/google";

// export function AuthenticatorComponent() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [errorMessage, setErrorMessage] = useState("");
//   const navigate = useNavigate();
//
//   const handleSubmit = async (event: FormEvent) => {
//     event.preventDefault();
//
//     try {
//       const response = await fetch(BASE_API_URL + "/login");
//       if (!response.ok) {
//         const errorData = await response.json();
//         console.error(
//           "Login failed:",
//           errorData.message || `Error: ${response.status}`,
//         );
//         setErrorMessage("Login failed");
//         return; // Early return to prevent further execution in case of an error
//       }
//
//       const data = await response.json();
//       localStorage.setItem(JWT_TOKEN_STORAGE, data.access_token);
//       console.log("Logged in successfully");
//       navigate("/plants/");
//     } catch (error) {
//       console.error(error);
//       setErrorMessage("Login failed");
//     }
//   };
//   const handleLogout = () => {
//     localStorage.removeItem(JWT_TOKEN_STORAGE);
//   };
//
//   return (
//     <Card style={{ width: "18rem", padding: "20px", margin: "20px auto" }}>
//       <Form onSubmit={handleSubmit}>
//         {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
//         <Form.Group className="mb-3" controlId="formBasicUsername">
//           <Form.Label>Email address</Form.Label>
//           <Form.Control
//             type="username"
//             placeholder="Enter username"
//             value={username}
//             onChange={(event) => setUsername(event.target.value)}
//           />
//         </Form.Group>
//         <Form.Group className="mb-3" controlId="formBasicPassword">
//           <Form.Label>Password</Form.Label>
//           <Form.Control
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(event) => setPassword(event.target.value)}
//           />
//         </Form.Group>
//         <Button
//           variant="primary"
//           type="submit"
//           style={{ width: "100%", fontSize: "16px" }}
//         >
//           Submit
//         </Button>
//       </Form>
//       <Button
//         onClick={(event) => handleLogout()}
//         variant="secondary"
//         style={{ marginTop: "10px" }}
//       >
//         Logout
//       </Button>
//     </Card>
//   );
// }

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

async function responseGoogle(response: CredentialResponse, nonce: string) {
  try {
    const tokenId = response.credential;
    const backendUrl = BASE_API_URL + "/auth";
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: tokenId, nonce: nonce }),
    });

    const data = await res.json();
    localStorage.setItem(JWT_TOKEN_STORAGE, data);
    console.log(data);
    console.log("Logged in successfully");
  } catch (error) {
    console.error("Error authenticating with backend:", error);
  }
}
export function AuthFromFrontEnd() {
  const nonce = generateNonce();
  const handleLogout = () => {
    localStorage.removeItem(JWT_TOKEN_STORAGE);
    console.log("Logged out successfully.");
  };

  const handleGoogleSuccess = (response: CredentialResponse) => {
    responseGoogle(response, nonce);
  };
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
