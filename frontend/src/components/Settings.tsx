import React, { useEffect, useState } from "react";
import "../styles/Settings.css";

interface WidgetSettings {
  orthodox: boolean;
  questions: boolean;
  members: boolean;
}

const Settings: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem("theme") === "dark"
  );
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [widgetSettings, setWidgetSettings] = useState<WidgetSettings>(() => {
    const savedSettings = localStorage.getItem("widgetSettings");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          orthodox: true,
          questions: true,
          members: true,
        };
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      isDarkMode ? "dark" : "light"
    );
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem("widgetSettings", JSON.stringify(widgetSettings));
  }, [widgetSettings]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleWidget = (widgetName: keyof WidgetSettings) => {
    setWidgetSettings((prev) => ({
      ...prev,
      [widgetName]: !prev[widgetName],
    }));
  };

  return (
    <div className={`settings-container ${isMobileView ? "mobile" : ""}`}>
      <div className="settings-card">
        <h2>Settings</h2>
        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="setting-item">
            <label className="toggle-switch">
              <span className="setting-label">Dark Mode</span>
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={toggleTheme}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        <div className="settings-section">
          <h3>Widgets</h3>
          <div className="setting-item">
            <label className="toggle-switch">
              <span className="setting-label">Orthodox Calendar</span>
              <input
                type="checkbox"
                checked={widgetSettings.orthodox}
                onChange={() => toggleWidget("orthodox")}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item">
            <label className="toggle-switch">
              <span className="setting-label">Questions</span>
              <input
                type="checkbox"
                checked={widgetSettings.questions}
                onChange={() => toggleWidget("questions")}
              />
              <span className="slider round"></span>
            </label>
          </div>
          <div className="setting-item">
            <label className="toggle-switch">
              <span className="setting-label">Members</span>
              <input
                type="checkbox"
                checked={widgetSettings.members}
                onChange={() => toggleWidget("members")}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
