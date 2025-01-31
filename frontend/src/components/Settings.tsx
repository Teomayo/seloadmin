import React, { useEffect, useState } from "react";
import "../styles/Settings.css";
import {
  getMemberInfo,
  logout,
  updateMemberInfo,
  updatePassword,
} from "../services/api";

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

  const [userEmail, setUserEmail] = useState<string>("");
  const [userPhone, setUserPhone] = useState<string>("");
  const [userOccupation, setUserOccupation] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchMemberDetails = async () => {
      const username = localStorage.getItem("userName");
      if (username) {
        try {
          const memberDetails = await getMemberInfo(username);
          console.log(memberDetails);
          setUserEmail(memberDetails.email);
          setUserPhone(memberDetails.phone_number);
          setUserOccupation(memberDetails.occupation);
        } catch (error) {
          console.error("Failed to fetch member details:", error);
        }
      }
    };

    fetchMemberDetails();
  }, []);
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = localStorage.getItem("userName");
    if (username) {
      try {
        await updateMemberInfo(username, {
          email: userEmail,
          phone_number: userPhone,
          occupation: userOccupation,
        });
        alert("Account information updated successfully!");
        setIsEditing(false); // Exit edit mode after successful update
      } catch (error) {
        console.error("Failed to update member details:", error);
        alert("Failed to update account information.");
      }
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }

    const username = localStorage.getItem("userName");
    if (username) {
      try {
        await updatePassword(username, {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        });
        alert("Password updated successfully!");
        setShowPasswordChange(false);
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } catch (error) {
        console.error("Failed to update password:", error);
        alert(
          "Failed to update password. Please check your current password and try again."
        );
      }
    }
  };

  return (
    <div className={`settings-container ${isMobileView ? "mobile" : ""}`}>
      <div className="settings-card">
        <h2>Settings</h2>
        <div className="settings-section">
          <h3>Account Information</h3>
          <form onSubmit={handleUpdate}>
            {isEditing ? (
              <>
                <p>
                  Email:
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    required
                  />
                </p>
                <p>
                  Phone Number:
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    required
                  />
                </p>
                <p>
                  Occupation:
                  <input
                    type="text"
                    value={userOccupation}
                    onChange={(e) => setUserOccupation(e.target.value)}
                    required
                  />
                </p>
                <div className="button-container">
                  <button type="button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button type="submit">Update Account Information</button>
                </div>
              </>
            ) : (
              <>
                <p>
                  Email: <a href={`mailto:${userEmail}`}>{userEmail}</a>
                </p>
                <p>
                  Phone Number: <a href={`tel:${userPhone}`}>{userPhone}</a>
                </p>
                <p>Occupation: {userOccupation}</p>
                <div className="button-container">
                  <button type="button" onClick={() => setIsEditing(true)}>
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPasswordChange(!showPasswordChange)}
                  >
                    Change Password
                  </button>
                </div>
              </>
            )}
          </form>

          {showPasswordChange && (
            <form
              onSubmit={handlePasswordChange}
              className="password-change-form"
            >
              <div className="password-fields">
                <p>
                  <label>Current Password:</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </p>
                <p>
                  <label>New Password:</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        newPassword: e.target.value,
                      })
                    }
                    required
                  />
                </p>
                <p>
                  <label>Confirm New Password:</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({
                        ...passwordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </p>
              </div>
              <div className="button-container">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({
                      currentPassword: "",
                      newPassword: "",
                      confirmPassword: "",
                    });
                  }}
                >
                  Cancel
                </button>
                <button type="submit">Update Password</button>
              </div>
            </form>
          )}
        </div>

        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="setting-item">
            <label className="toggle-switch">
              <span className="setting-label">Dark Mode</span>
              <input
                type="checkbox"
                checked={isDarkMode}
                onChange={() => setIsDarkMode(!isDarkMode)}
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
