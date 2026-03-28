import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Analyze from "./pages/Analyze";
import Results from "./pages/Results";
import Profile from "./pages/Profile";
import Models from "./pages/Models";
import Landing from "./pages/Landing";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("loggedUser") ? true : false
  );

  return (
    <Router>
      {isLoggedIn && <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />}

      <Routes>
        <Route path="/" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Login setIsLoggedIn={setIsLoggedIn} />}
        />
        <Route path="/signup" element={isLoggedIn ? <Navigate to="/dashboard" replace /> : <Signup />} />

        <Route path="/dashboard" element={isLoggedIn ? <Dashboard /> : <Navigate to="/" replace />} />
        <Route path="/analyze" element={isLoggedIn ? <Analyze /> : <Navigate to="/" replace />} />
        <Route path="/results" element={isLoggedIn ? <Results /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/" replace />} />
        <Route path="/models" element={isLoggedIn ? <Models /> : <Navigate to="/" replace />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
