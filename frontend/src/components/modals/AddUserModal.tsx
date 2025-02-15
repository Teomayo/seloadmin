import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { createUser } from "../../services/api";

interface AddUserModalProps {
  show: boolean;
  onHide: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ show, onHide }) => {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    position: "",
    phone_number: "",
    occupation: "",
    is_active: false,
    is_staff: false,
    is_superuser: false,
    paid: false,
    last_login: new Date().toISOString(),
    date_joined: new Date().toISOString(),
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(userData);
      alert(
        "User created successfully! A password reset email has been sent to " +
          userData.email
      );
      onHide();
      setUserData({
        username: "",
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        position: "",
        phone_number: "",
        occupation: "",
        is_active: false,
        is_staff: false,
        is_superuser: false,
        paid: false,
        last_login: new Date().toISOString(),
        date_joined: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Failed to create user.");
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Create User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formUsername">
            <Form.Label>Username</Form.Label>
            <Form.Control
              type="text"
              name="username"
              placeholder="Enter username"
              value={userData.username}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Enter email"
              value={userData.email}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formFirstName">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              name="first_name"
              placeholder="Enter first name"
              value={userData.first_name}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formLastName">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              name="last_name"
              placeholder="Enter last name"
              value={userData.last_name}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formPosition">
            <Form.Label>Position</Form.Label>
            <Form.Control
              type="text"
              name="position"
              placeholder="Enter position"
              value={userData.position}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group controlId="formPhoneNumber">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              name="phone_number"
              placeholder="Enter phone number"
              value={userData.phone_number}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group controlId="formOccupation">
            <Form.Label>Occupation</Form.Label>
            <Form.Control
              type="text"
              name="occupation"
              placeholder="Enter occupation"
              value={userData.occupation}
              onChange={handleChange}
            />
          </Form.Group>
          <br />
          <Form.Group className="checkbox-container">
            <Form.Check
              type="checkbox"
              id="is_staff"
              name="is_staff"
              label="Staff"
              checked={userData.is_staff}
              onChange={handleChange}
            />
            <Form.Check
              type="checkbox"
              id="is_superuser"
              name="is_superuser"
              label="Super User"
              checked={userData.is_superuser}
              onChange={handleChange}
            />
            <Form.Check
              type="checkbox"
              id="paid"
              name="paid"
              label="Paid"
              checked={userData.paid}
              onChange={handleChange}
            />
          </Form.Group>
          <div className="form-text text-muted mb-3">
            A password reset email will be sent to the user's email address.
          </div>
          <div className="modal-footer">
            <button className="admin-button" type="submit">
              Create User
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddUserModal;
