
import React  from 'react';
import {PlantList,PlantDetails} from './PlantComponents';
import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";

function App() {
      return (
    <Router basename="/">
        <Routes>
            <Route path="/" element={<PlantList />} />
            <Route path="/plants/" element={<PlantList />} />
            <Route path="/plants/:plantId" element={<PlantDetails />} />
        </Routes>
    </Router>
  );
}

export default App;
