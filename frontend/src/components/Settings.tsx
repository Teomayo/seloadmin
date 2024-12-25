import React, { useState, useEffect } from "react";
import Layout from "./Layout.tsx";
import "../styles/Settings.css";

const Settings: React.FC = () => {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <Layout>
      <div className="settings">
        <h1>Settings</h1>
        <div style={{ display: "flex", alignItems: "center" }}>
          <label className="switch">
            <input
              type="checkbox"
              onChange={toggleTheme}
              checked={theme === "dark"}
            />
            <span className="slider round"></span>
          </label>
          <span>Dark Mode</span>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
