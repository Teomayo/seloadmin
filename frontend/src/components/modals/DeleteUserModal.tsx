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
  const [selectedUsername, setSelectedUsername] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      window.confirm(
        `Are you sure you want to delete user ${selectedUsername}?`
      )
    ) {
      try {
        await deleteUser(selectedUsername);
        alert("User deleted successfully!");
        onHide();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("Failed to delete user.");
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
          <Form.Group controlId="formUsername">
            <Form.Label>Select User to Delete</Form.Label>
            <Form.Control
              as="select"
              value={selectedUsername}
              onChange={(e) => setSelectedUsername(e.target.value)}
              required
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.ID} value={user.Username}>
                  {user.Username}
                </option>
              ))}
            </Form.Control>
          </Form.Group>
          <div className="modal-footer">
            <Button variant="danger" type="submit" className="admin-button">
              Delete User
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default DeleteUserModal;
