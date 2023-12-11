
import React  from 'react';
import {PlantList,PlantDetails} from './PlantComponents';
import {
    BrowserRouter as Router,
    Routes,
    Route, Navigate, Outlet,
} from "react-router-dom";
import {AuthenticatorComponent, AuthFromFrontEnd} from "./Authenticator";
import {JWT_TOKEN_STORAGE} from "./constants";

const ProtectedRoute = () => {
    const token = localStorage.getItem(JWT_TOKEN_STORAGE);
    if (!token) {
        return <Navigate to="/login" replace={true} />;
    }
    return <Outlet />;
}

function App() {
      return (
    <Router basename="/">
        <Routes>
            <Route path="/" element={<AuthFromFrontEnd />} />
            <Route path="/login" element={<AuthFromFrontEnd />} />
            <Route element={<ProtectedRoute />}>
                <Route path="/plants/" element={<PlantList />} />
                <Route path="/plants/:plantId" element={<PlantDetails />} />
            </Route>
        </Routes>
    </Router>
  );
}

export default App;
