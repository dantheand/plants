import { useEffect, useState } from "react";
import { PlantDetails } from "./PlantDetails";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthFromFrontEnd } from "./Authenticator";
import { BASE_API_URL, JWT_TOKEN_STORAGE } from "./constants";
import { PlantList } from "./PlantList";
import { PlantCreate } from "./PlantCreate";
import { GlobalLayout } from "./Layouts";

// TODO: improve this approach so that it doesn't require a full page refresh to send users to the login page
//
const ProtectedRoute = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkTokenValidity = async () => {
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
        if (data === true) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Error authenticating with backend:", error);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };
    checkTokenValidity();
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
