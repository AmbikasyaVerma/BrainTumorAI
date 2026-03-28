import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("loggedUser"));
    const savedHistory = JSON.parse(localStorage.getItem("history")) || [];

    if (!loggedUser) {
      navigate("/login");
      return;
    }

    setUser(loggedUser);
    setHistory(savedHistory);
  }, [navigate]);

  const profileStats = useMemo(() => {
    const total = history.length;
    const lastScan = history[0]?.createdAt ? new Date(history[0].createdAt).toLocaleString() : "No scans yet";
    return { total, lastScan };
  }, [history]);

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-card">
        <p className="analyze-eyebrow">Account</p>
        <h2>User Profile</h2>

        <div className="profile-grid">
          <div className="profile-item">
            <span>Name</span>
            <strong>{user.name}</strong>
          </div>
          <div className="profile-item">
            <span>Email</span>
            <strong>{user.email}</strong>
          </div>
          <div className="profile-item">
            <span>Role</span>
            <strong>{user.role || "User"}</strong>
          </div>
          <div className="profile-item">
            <span>Total Scans</span>
            <strong>{profileStats.total}</strong>
          </div>
          <div className="profile-item full">
            <span>Last Scan</span>
            <strong>{profileStats.lastScan}</strong>
          </div>
        </div>

        <button className="results-btn" onClick={() => navigate("/analyze")}>
          Analyze MRI
        </button>
      </div>
    </div>
  );
};

export default Profile;
