import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/api";
import "../styles/Login.css";
import LoadingScreen from "./LoadingScreen";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      // Wait for settings to be applied before navigating
      await new Promise((resolve) => {
        const checkSettings = () => {
          const savedSettings = localStorage.getItem("widgetSettings");
          if (savedSettings) {
            resolve(true);
          } else {
            setTimeout(checkSettings, 100);
          }
        };
        checkSettings();
      });
    } catch (error: any) {
      setError(error.message || "Failed to login");
      setIsLoading(false);
    }
  };

  const handleLoadingComplete = () => {
    setIsLoading(false);
    navigate("/");
  };

  if (isLoading) {
    return <LoadingScreen onLoadingComplete={handleLoadingComplete} />;
  }

  return (
    <div className="login-container">
      <div className="background-logo" />
      <div className="login-card">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;
