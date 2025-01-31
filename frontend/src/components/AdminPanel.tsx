import React, { useEffect, useState } from "react";
import { Button } from "react-bootstrap";
import "../styles/AdminPanel.css";
import { User } from "../interfaces";
import { getUsers } from "../services/api";
import AddUserModal from "./modals/AddUserModal";
import UpdateUserModal from "./modals/UpdateUserModal";
import DeleteUserModal from "./modals/DeleteUserModal";

const AdminPanel: React.FC = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };
    fetchUsers();
  }, []);

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

      <AddUserModal show={showAddModal} onHide={() => setShowAddModal(false)} />

      <UpdateUserModal
        show={showUpdateModal}
        onHide={() => setShowUpdateModal(false)}
        users={users}
      />

      <DeleteUserModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        users={users}
      />
    </div>
  );
};

export default AdminPanel;
