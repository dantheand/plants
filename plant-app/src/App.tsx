import React, { useEffect, useState } from "react";
import { PlantDetails } from "./views/PlantDetails";
import { UserList } from "./views/UserList";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
  useLocation,
} from "react-router-dom";
import {
  AuthFromFrontEnd,
  Logout,
} from "./components/authentication/Authenticator";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "./constants";
import { PlantList } from "./views/PlantList";
import { PlantCreate } from "./views/PlantCreate";
import { BaseLayout, GlobalLayout } from "./components/Layouts";

import "./styles/styles.scss";
import { jwtDecode } from "jwt-decode";
import { JwtPayload } from "./types/interfaces";
import { Card, Placeholder } from "react-bootstrap";

const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation(); // Use the useLocation hook to rerun auth on every navigation

  useEffect(() => {
    const checkTokenWithBackend = async () => {
      try {
        const res = await fetch(`${BASE_API_URL}/check_token`, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });
        setIsAuthenticated(res.ok && (await res.json()));
      } catch (error) {
        console.error("Error authenticating with backend:", error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkTokenWithBackend();
  }, [location]);

  if (isLoading) {
    return (
      <BaseLayout>
        <Card className="top-level-card">
          <Card.Header>
            <Placeholder as="h4" animation="glow">
              <Placeholder />
            </Placeholder>
          </Card.Header>
          <Card.Body>
            {/* Placeholder for a title or large text */}
            <Placeholder as={Card.Title} animation="glow">
              <Placeholder xs={8} />
            </Placeholder>

            {/* Multiple lines of placeholder text */}
            <Placeholder as={Card.Text} animation="glow">
              <Placeholder xs={7} /> <Placeholder xs={4} />{" "}
              <Placeholder xs={4} />
              <Placeholder xs={6} /> <Placeholder xs={8} />
            </Placeholder>
          </Card.Body>
        </Card>
      </BaseLayout>
    );
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
            <Route path="/plants/user/:userId" element={<PlantList />} />
            <Route path="/plants/:plantId" element={<PlantDetails />} />
            <Route path="/plants/create/:nextId" element={<PlantCreate />} />
            <Route path="/users" element={<UserList />} />
          </Route>
          {/* Redirect to login by default */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </GlobalLayout>
    </Router>
  );
}

export default App;
