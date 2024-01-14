import { useEffect, useState } from "react";
import { PlantDetails } from "./views/PlantDetails";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthFromFrontEnd, Logout } from "./components/Authenticator";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "./constants";
import { PlantList } from "./views/PlantList";
import { PlantCreate } from "./views/PlantCreate";
import { GlobalLayout } from "./components/Layouts";

import "./styles/styles.css";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "./types/interfaces";

// TODO: improve this approach so that it doesn't require a full page refresh to send users to the login page
//
const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTokenWithBackend = async () => {
      const token = localStorage.getItem(JWT_TOKEN_STORAGE);
      if (!token) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      try {
        const res = await fetch(`${BASE_API_URL}/check_token`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        if (!res.ok) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const data = await res.json();
        setIsAuthenticated(data === true);

        // If the backend verifies the token, set up client-side expiration check
        if (data === true) {
          setUpTokenExpirationCheck(token);
        }
      } catch (error) {
        console.error("Error authenticating with backend:", error);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    const setUpTokenExpirationCheck = (token: string) => {
      const checkTokenExpiration = () => {
        try {
          const decodedToken: JwtPayload = jwtDecode(token);
          const currentUnixTimestamp = Date.now() / 1000;
          if (!decodedToken || decodedToken.exp < currentUnixTimestamp) {
            setIsAuthenticated(false);
            return false;
          }
          return true;
        } catch (error) {
          console.error("Error decoding token:", error);
          setIsAuthenticated(false);
          return false;
        }
      };

      // Set up an interval for continuous token validation
      const intervalId = setInterval(() => {
        if (!checkTokenExpiration()) {
          clearInterval(intervalId);
        }
      }, 60000); // Check every minute

      // Clean up interval on component unmount
      return () => clearInterval(intervalId);
    };

    checkTokenWithBackend();
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace={true} />;
  }
  return <Outlet />;
};

function App() {
  return (
    <Router basename="/">
      <GlobalLayout>
        <Routes>
          <Route path="/" element={<AuthFromFrontEnd />} />
          <Route path="/login" element={<AuthFromFrontEnd />} />
          <Route path="/logout" element={<Logout />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/plants" element={<PlantList />} />
            <Route path="/plants/:plantId" element={<PlantDetails />} />
            <Route path="/plants/create" element={<PlantCreate />} />
          </Route>
        </Routes>
      </GlobalLayout>
    </Router>
  );
}

export default App;
