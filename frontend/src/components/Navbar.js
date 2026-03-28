import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";

const Navbar = ({ isLoggedIn, setIsLoggedIn }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("loggedUser");
    setIsLoggedIn(false);
    navigate("/");
  };

  return (
    <header className="main-nav">
      <Link to={isLoggedIn ? "/dashboard" : "/"} className="brand-link">
        NeuroAI
      </Link>

      <div className="nav-links">
        {isLoggedIn ? (
          <>
            <NavLink to="/dashboard" className="nav-link">Dashboard</NavLink>
            <NavLink to="/analyze" className="nav-link">Analyze</NavLink>
            <NavLink to="/profile" className="nav-link">Profile</NavLink>
            <NavLink to="/models" className="nav-link">Models</NavLink>

            <button onClick={handleLogout} className="logout-btn">
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link">Login</NavLink>
            <NavLink to="/signup" className="nav-link">Signup</NavLink>
          </>
        )}
      </div>
    </header>
  );
};

export default Navbar;
