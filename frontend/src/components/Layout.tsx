import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../styles/Layout.css";
import { logout } from "../services/api";
import { useNavigate } from "react-router-dom";
import Menu from "./Menu";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const username = localStorage.getItem("userName");

  const toggleSidebarVisibility = () => {
    setIsSidebarVisible(!isSidebarVisible);
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="layout-container">
      <div
        className={`sidebar ${isSidebarVisible ? "visible" : ""}`}
        id="sidebar"
      >
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
      </div>
      <div className="main-content">
        {isMobileView && <Menu />}
        {children}
      </div>
    </div>
  );
};

export default Layout;
