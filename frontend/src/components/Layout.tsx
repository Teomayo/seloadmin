import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Layout.css";
import { logout } from "../services/api";
import { useNavigate } from "react-router-dom";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const username = localStorage.getItem("userName");
  const toggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div
      className={`layout-container ${
        isSidebarMinimized ? "sidebar-minimized" : ""
      }`}
    >
      <div className="sidebar">
        <div className="sidebar-content">
          <h2>Menu</h2>
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/settings">Settings</Link>
            </li>
          </ul>
        </div>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={handleLogout}>
            Logout
          </button>
          <br />
          <small>Logged in as: {username}</small>
        </div>
        <button className="toggle-button" onClick={toggleSidebar}>
          {isSidebarMinimized ? ">" : "<"}
        </button>
      </div>
      <div className="main-content">{children}</div>
    </div>
  );
};

export default Layout;
