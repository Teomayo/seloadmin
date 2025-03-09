import React, { useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { createUser } from "../../services/api";
import {
  validateEmail,
  validatePhone,
  formatPhoneNumber,
  getValidationError,
} from "../../utils/validation";

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

  const [validationErrors, setValidationErrors] = useState<{
    email: string | null;
    phone_number: string | null;
    password: string | null;
  }>({
    email: null,
    phone_number: null,
    password: null,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setUserData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate fields as they're typed
    if (["email", "phone_number"].includes(name)) {
      const otherField = name === "email" ? "phone_number" : "email";
      const otherValue =
        name === "email" ? userData.phone_number : userData.email;

      setValidationErrors((prev) => ({
        ...prev,
        [name]: getValidationError(name, value, {
          [otherField]: otherValue,
        }),
      }));

      // Update other field's validation as well since they're interdependent
      setValidationErrors((prev) => ({
        ...prev,
        [otherField]: getValidationError(otherField, otherValue, {
          [name]: value,
        }),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields before submission
    const emailError = getValidationError("email", userData.email, {
      phone_number: userData.phone_number,
    });
    const phoneError = getValidationError(
      "phone_number",
      userData.phone_number,
      {
        email: userData.email,
      }
    );

    // Add password validation
    const passwordError =
      userData.password.length < 8
        ? "Password must be at least 8 characters long"
        : null;

    setValidationErrors({
      email: emailError,
      phone_number: phoneError,
      password: passwordError,
    });

    if (emailError || phoneError || passwordError) {
      return;
    }

    try {
      // Format phone number before sending if it exists
      const formattedData = {
        ...userData,
        phone_number: userData.phone_number
          ? formatPhoneNumber(userData.phone_number)
          : "",
      };

      await createUser(formattedData);
      alert("User created successfully!");
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
      setValidationErrors({
        email: null,
        phone_number: null,
        password: null,
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
          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="password"
              placeholder="Enter password"
              value={userData.password}
              onChange={handleChange}
              required
              isInvalid={!!validationErrors.password}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.password}
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="formEmail">
            <Form.Label>
              Email {!userData.phone_number && "(Required when phone is empty)"}
            </Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Enter email"
              value={userData.email}
              onChange={handleChange}
              isInvalid={!!validationErrors.email}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.email}
            </Form.Control.Feedback>
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
            <Form.Label>
              Phone Number {!userData.email && "(Required when email is empty)"}
            </Form.Label>
            <Form.Control
              type="tel"
              name="phone_number"
              placeholder="Enter phone number"
              value={userData.phone_number}
              onChange={handleChange}
              isInvalid={!!validationErrors.phone_number}
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.phone_number}
            </Form.Control.Feedback>
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
