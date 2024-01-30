import React from "react";
import { PlantDetails } from "./views/PlantDetails";
import { UserList } from "./views/UserList";
import { TestBox } from "./views/TestBox";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AuthFromFrontEnd } from "./components/authentication/Authenticator";
import { PlantList } from "./views/PlantList";
import { PlantCreate } from "./views/PlantCreate";
import { GlobalLayout } from "./components/Layouts";

import "./styles/styles.scss";
import { AuthProvider, useAuth } from "./context/Auth";
import { AlertProvider } from "./context/Alerts";
import { PlantProvider } from "./context/Plants";

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth(); // Use the custom hook to access auth state
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <Router basename="/">
      <AlertProvider>
        <AuthProvider>
          <PlantProvider>
            <GlobalLayout>
              <Routes>
                <Route path="/" element={<AuthFromFrontEnd />} />
                <Route path="/login" element={<AuthFromFrontEnd />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/plants/user/:userId" element={<PlantList />} />
                  <Route path="/plants/:plantId" element={<PlantDetails />} />
                  <Route
                    path="/plants/create/:nextId"
                    element={<PlantCreate />}
                  />
                  <Route path="/users" element={<UserList />} />
                </Route>
                {/* Redirect to login by default */}
                <Route path="*" element={<Navigate to="/login" replace />} />
                <Route path="/testing" element={<TestBox />} />
              </Routes>
            </GlobalLayout>
          </PlantProvider>
        </AuthProvider>
      </AlertProvider>
    </Router>
  );
}

export default App;
