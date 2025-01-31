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
    firstName: "",
    lastName: "",
    position: "",
    phoneNumber: "",
    occupation: "",
    isActive: false,
    isStaff: false,
    isSuperUser: false,
    paid: false,
    lastLogin: new Date().toISOString(),
    dateJoined: new Date().toISOString(),
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
      alert("User created successfully!");
      onHide();
      setUserData({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        position: "",
        phoneNumber: "",
        occupation: "",
        isActive: false,
        isStaff: false,
        isSuperUser: false,
        paid: false,
        lastLogin: new Date().toISOString(),
        dateJoined: new Date().toISOString(),
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
          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Enter password"
              value={userData.password}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formFirstName">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              name="firstName"
              placeholder="Enter first name"
              value={userData.firstName}
              onChange={handleChange}
              required
            />
          </Form.Group>
          <Form.Group controlId="formLastName">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              name="lastName"
              placeholder="Enter last name"
              value={userData.lastName}
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
              name="phoneNumber"
              placeholder="Enter phone number"
              value={userData.phoneNumber}
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
              id="isStaff"
              name="isStaff"
              label="Staff"
              checked={userData.isStaff}
              onChange={handleChange}
            />
            <Form.Check
              type="checkbox"
              id="isSuperUser"
              name="isSuperUser"
              label="Super User"
              checked={userData.isSuperUser}
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
