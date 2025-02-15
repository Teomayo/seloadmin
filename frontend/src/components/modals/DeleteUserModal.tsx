import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { deleteUser } from "../../services/api";
import { User } from "../../interfaces";

interface DeleteUserModalProps {
  show: boolean;
  onHide: () => void;
  users: User[];
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  show,
  onHide,
  users,
}) => {
  const [selectedUID, setSelectedUID] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUID) {
      alert("Please select a user to delete");
      return;
    }

    if (window.confirm(`Are you sure you want to delete this user?`)) {
      try {
        await deleteUser(selectedUID);
        alert("User deleted successfully!");
        setSelectedUID(""); // Reset selection
        onHide();
      } catch (error: any) {
        console.error("Error deleting user:", error);
        alert(error.message || "Failed to delete user.");
      }
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Delete User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formUID">
            <Form.Label>Select User to Delete</Form.Label>
            <Form.Select
              value={selectedUID}
              onChange={(e) => setSelectedUID(e.target.value)}
              required
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.email} ({user.first_name} {user.last_name})
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <div className="modal-footer">
            <Button
              variant="danger"
              type="submit"
              className="admin-button"
              disabled={!selectedUID}
            >
              Delete User
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default DeleteUserModal;
