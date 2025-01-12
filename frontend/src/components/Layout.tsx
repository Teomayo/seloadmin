import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu as MenuIcon, LogOut as LogOutIcon } from "react-feather";
import "../styles/Layout.css";
import { logout } from "../services/api";

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarVisible, setIsSidebarVisible] = useState(false);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const username = localStorage.getItem("userName");
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="layout-container">
      {isMobileView ? (
        <>
          <div className="mobile-header">
            <button
              className="mobile-menu-button"
              onClick={() => setIsSidebarVisible(true)}
            >
              <MenuIcon size={24} />
            </button>
            <h1 className="mobile-title">Dashboard</h1>
            <button className="mobile-logout-button" onClick={handleLogout}>
              <LogOutIcon size={24} />
            </button>
          </div>
          {isSidebarVisible && (
            <div
              className="mobile-sidebar-overlay"
              onClick={() => setIsSidebarVisible(false)}
            >
              <div
                className="mobile-sidebar"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="mobile-sidebar-header">
                  <span className="user-name">{username}</span>
                </div>
                <nav className="mobile-nav">
                  <Link to="/" onClick={() => setIsSidebarVisible(false)}>
                    Home
                  </Link>
                  <Link
                    to="/settings"
                    onClick={() => setIsSidebarVisible(false)}
                  >
                    Settings
                  </Link>
                </nav>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className={`sidebar ${isSidebarVisible ? "visible" : ""}`}>
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
            <small>Logged in as: {username}</small>
          </div>
        </div>
      )}
      <div className={`main-content ${isMobileView ? "mobile" : ""}`}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
