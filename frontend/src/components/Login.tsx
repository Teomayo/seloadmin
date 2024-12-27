import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, getQuestions } from "../services/api";
import "../styles/Login.css";

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  console.log(localStorage.getItem("theme"));

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const navigate = useNavigate();

  function getVotedQuestionIds(username: string, questions: any[]) {
    return questions
      .filter((question) => question.voted_users.includes(username))
      .map((question) => question.id);
  }

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(username, password);
      const questions = await getQuestions();
      localStorage.setItem("questions", JSON.stringify(questions));
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
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="error">{error}</p>}
        <button type="submit">Login</button>
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
