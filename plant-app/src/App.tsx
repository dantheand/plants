import React from "react";
import { PlantDetails } from "./views/PlantDetails";
import { UserList } from "./views/UserList";
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

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth(); // Use the custom hook to access auth state
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router basename="/">
        <GlobalLayout>
          <Routes>
            <Route path="/" element={<AuthFromFrontEnd />} />
            <Route path="/login" element={<AuthFromFrontEnd />} />
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
    </AuthProvider>
  );
}

export default App;
