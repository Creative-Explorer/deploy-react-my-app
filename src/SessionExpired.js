import React, { useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./SessionExpired.css"; // Import the CSS file

const SessionExpired = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLoginRedirect = useCallback(() => {
    window.localStorage.removeItem("access_token");
    window.localStorage.removeItem("access_phoneNumber");
    logout();
    navigate("/login");
  }, [logout, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleLoginRedirect();
    }, 300000); // 5 minutes

    return () => clearTimeout(timer);
  }, [handleLoginRedirect]);

  return (
    <div className="session-expired-container">
      <div className="session-expired-content">
        <h1>Session Expired</h1>
        <p>Your session has expired due to inactivity. Please log in again.</p>
        <button className="login-button" onClick={handleLoginRedirect}>
          Go to Login Page
        </button>
      </div>
    </div>
  );
};

export default SessionExpired;
