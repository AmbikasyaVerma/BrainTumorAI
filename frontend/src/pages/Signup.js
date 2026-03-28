import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignup = (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      alert("Fill all fields");
      return;
    }

    const user = { name, email, password };

    localStorage.setItem("user", JSON.stringify(user));

    alert("Signup successful!");

    navigate("/login");
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Signup</h2>

        <form onSubmit={handleSignup}>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

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

          <button type="submit">Signup</button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
