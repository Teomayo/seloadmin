import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, getQuestions } from "../services/api";
import "../styles/Login.css";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  function getVotedQuestionIds(username: string, questions: any[]) {
    return questions
      .filter((question) => question.voted_users?.includes(username))
      .map((question) => question.id);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await login(username, password);

      // Fetch questions after successful login
      const questions = await getQuestions();
      localStorage.setItem("questions", JSON.stringify(questions));

      // Store voted questions in session storage
      const votedQuestionIds = getVotedQuestionIds(username, questions);
      sessionStorage.setItem(
        "votedQuestions",
        JSON.stringify(votedQuestionIds)
      );

      navigate("/");
    } catch (err) {
      setError("Invalid username or password");
    }
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="username">Username:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">
          Login
        </button>
      </form>
      <div className="toggle-container">
        <label className="switch">
          <input
            type="checkbox"
            onChange={toggleTheme}
            checked={theme === "dark"}
          />
          <span className="slider"></span>
        </label>
        <span>{theme === "light" ? "Light Mode" : "Dark Mode"}</span>
      </div>
    </div>
  );
};

export default Login;
