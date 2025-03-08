import React, { ChangeEvent, useEffect, useState } from "react";
import { Form, Modal, Button } from "react-bootstrap";

import { User } from "../../interfaces";
import { updateUser } from "../../services/api";
import {
  validateEmail,
  validatePhone,
  formatPhoneNumber,
  getValidationError,
} from "../../utils/validation";

interface UpdateUserModalProps {
  show: boolean;
  onHide: () => void;
  users: User[];
}

const UpdateUserModal: React.FC<UpdateUserModalProps> = ({
  show,
  onHide,
  users,
}) => {
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [userData, setUserData] = useState<Partial<User>>({});
  const [validationErrors, setValidationErrors] = useState<{
    email: string | null;
    phone_number: string | null;
  }>({
    email: null,
    phone_number: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const userId = e.target.value;
    setSelectedUser(userId);
    const user = users.find((u) => u.uid === userId);
    if (user) {
      setUserData(user);
      // Validate initial values
      setValidationErrors({
        email: getValidationError("email", user.email || ""),
        phone_number: getValidationError(
          "phone_number",
          user.phone_number || ""
        ),
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setUserData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate fields as they're typed
    if (["email", "phone_number"].includes(name)) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: getValidationError(name, value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedUser) {
      alert("Please select a user to update");
      return;
    }

    // Validate all fields before submission
    const emailError = getValidationError("email", userData.email || "");
    const phoneError = getValidationError(
      "phone_number",
      userData.phone_number || ""
    );

    setValidationErrors({
      email: emailError,
      phone_number: phoneError,
    });

    if (emailError || phoneError) {
      return;
    }

    try {
      // Format phone number before sending
      const formattedData = {
        ...userData,
        phone_number: userData.phone_number
          ? formatPhoneNumber(userData.phone_number)
          : undefined,
      };

      setIsSubmitting(true);
      await updateUser(selectedUser, formattedData);
      alert("User updated successfully!");
      onHide();
      setSelectedUser("");
      setUserData({});
      setValidationErrors({
        email: null,
        phone_number: null,
      });
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Failed to update user.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!show) {
      setSelectedUser("");
      setUserData({});
      setValidationErrors({
        email: null,
        phone_number: null,
      });
    }
  }, [show]);

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Update User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formUserSelect">
            <Form.Label>Select User</Form.Label>
            <Form.Select
              value={selectedUser}
              onChange={handleUserSelect}
              required
            >
              <option value="">Select a user...</option>
              {users.map((user) => (
                <option key={user.uid} value={user.uid}>
                  {user.email} - {user.first_name} {user.last_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedUser && (
            <>
              <Form.Group controlId="formEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={userData.email || ""}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="formPhoneNumber">
                <Form.Label>Phone Number</Form.Label>
                <Form.Control
                  type="tel"
                  name="phone_number"
                  value={userData.phone_number || ""}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.phone_number}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.phone_number}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group controlId="formFirstName">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="first_name"
                  placeholder="Enter first name"
                  value={userData.first_name || ""}
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
                  value={userData.last_name || ""}
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
                  value={userData.position || ""}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group controlId="formOccupation">
                <Form.Label>Occupation</Form.Label>
                <Form.Control
                  type="text"
                  name="occupation"
                  placeholder="Enter occupation"
                  value={userData.occupation || ""}
                  onChange={handleChange}
                />
              </Form.Group>

              <br />
              <Form.Group className="checkbox-container">
                <Form.Check
                  type="checkbox"
                  id="isStaff"
                  name="is_staff"
                  label="Staff"
                  checked={userData.is_staff || false}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  id="isSuperUser"
                  name="is_superuser"
                  label="Super User"
                  checked={userData.is_superuser || false}
                  onChange={handleChange}
                />
                <Form.Check
                  type="checkbox"
                  id="paid"
                  name="paid"
                  label="Paid"
                  checked={userData.paid || false}
                  onChange={handleChange}
                />
              </Form.Group>

              <div className="modal-footer">
                <button type="button" className="admin-button" onClick={onHide}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-button"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Updating..." : "Update User"}
                </button>
              </div>
            </>
          )}
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default UpdateUserModal;
