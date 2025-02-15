import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import "../styles/AdminPanel.css";
import { User } from "../interfaces";
import { getUsers } from "../services/api";
import AddUserModal from "./modals/AddUserModal";
import UpdateUserModal from "./modals/UpdateUserModal";
import DeleteUserModal from "./modals/DeleteUserModal";
import { auth } from "../services/firebase"; // Import auth
import { onAuthStateChanged } from "firebase/auth";

const AdminPanel: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No authenticated user");
      }
      const data = await getUsers();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError(
        "Failed to load users. Please ensure you are logged in with admin privileges."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        fetchUsers();
      } else {
        setError("Please log in to access the admin panel");
        setLoading(false);
      }
    });

    // Hide sidebar on mobile when component mounts
    if (window.innerWidth <= 768) {
      document.body.classList.add("sb-sidenav-toggled");
    }

    return () => {
      unsubscribe();
      document.body.classList.remove("sb-sidenav-toggled");
    };
  }, []);

  // Refresh users when modals are closed
  const handleModalClose = () => {
    fetchUsers();
  };

  if (loading)
    return (
      <div className="admin-container">
        <div className="loading-spinner">Loading users...</div>
      </div>
    );

  if (error)
    return (
      <div className="admin-container">
        <div className="error-message">Error: {error}</div>
      </div>
    );

  if (!isAuthenticated)
    return (
      <div className="admin-container">
        <div className="error-message">
          Please log in to access the admin panel
        </div>
      </div>
    );

  return (
    <div className="admin-container">
      <h2>Admin Panel</h2>
      <div className="admin-buttons">
        <Button className="admin-button" onClick={() => setShowAddModal(true)}>
          Add User
        </Button>
        <Button
          className="admin-button"
          onClick={() => setShowUpdateModal(true)}
        >
          Update User
        </Button>
        <Button
          className="admin-button"
          onClick={() => setShowDeleteModal(true)}
        >
          Delete User
        </Button>
      </div>

      <AddUserModal
        show={showAddModal}
        onHide={() => {
          setShowAddModal(false);
          handleModalClose();
        }}
      />

      <UpdateUserModal
        show={showUpdateModal}
        onHide={() => {
          setShowUpdateModal(false);
          handleModalClose();
        }}
        users={users}
      />

      <DeleteUserModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          handleModalClose();
        }}
        users={users}
      />
    </div>
  );
};

export default AdminPanel;
