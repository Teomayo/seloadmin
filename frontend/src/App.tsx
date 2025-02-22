import React, { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import Login from "./components/Login";
import "./styles/theme.css";
import Members from "./components/Members";
import AdminPanel from "./components/AdminPanel";
import Contacts from "./components/Contacts";
import { auth } from "./services/firebase";

const App: React.FC = () => {
  useEffect(() => {
    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);

    // Set up auth state listener
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        const theme = localStorage.getItem("theme");
        localStorage.clear();
        if (theme) localStorage.setItem("theme", theme);
      }
    });

    return () => unsubscribe();
  }, []);

  // Check if user is authenticated
  const isAuthenticated = () => {
    return localStorage.getItem("isAuthenticated") === "true";
  };

  // Protected Route wrapper
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (!isAuthenticated()) {
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Layout>
              <Settings />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/members"
        element={
          <ProtectedRoute>
            <Layout>
              <Members />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Layout>
              <AdminPanel />
            </Layout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/contacts"
        element={
          <ProtectedRoute>
            <Layout>
              <Contacts />
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
