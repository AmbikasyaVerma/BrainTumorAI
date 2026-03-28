import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Login = ({ setIsLoggedIn }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    const savedUser = JSON.parse(localStorage.getItem("user"));

    // Demo user
    if (email === "admin@gmail.com" && password === "1234") {
      localStorage.setItem(
        "loggedUser",
        JSON.stringify({
          name: "Admin",
          email: "admin@gmail.com",
          role: "Demo User",
        })
      );

      setIsLoggedIn(true);
      navigate("/dashboard");
      return;
    }

    // Signup user
    if (
      savedUser &&
      email === savedUser.email &&
      password === savedUser.password
    ) {
      localStorage.setItem("loggedUser", JSON.stringify(savedUser));

      setIsLoggedIn(true);
      navigate("/dashboard");
    } else {
      alert("Invalid Email or Password");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit">Login</button>
        </form>

        <p>Demo: admin@gmail.com / 1234</p>
      </div>
    </div>
  );
};

export default Login;
