import { ChangeEvent, useEffect, useState } from "react";
import { Form } from "react-bootstrap";

import { Modal } from "react-bootstrap";
import { User } from "../../interfaces";
import { updateUser } from "../../services/api";

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
  const [selectedUsername, setSelectedUsername] = useState("");
  const [userData, setUserData] = useState<User>({
    ID: 0,
    Username: "",
    Email: "",
    Password: "",
    FirstName: "",
    LastName: "",
    Position: "",
    PhoneNumber: "",
    Occupation: "",
    IsActive: false,
    IsStaff: false,
    IsSuperUser: false,
    Paid: false,
    LastLogin: "",
    DateJoined: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser(userData.Username, userData);
    alert("User updated successfully!");
    onHide();
  };

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (!show) {
      setSelectedUsername("");
      setUserData({
        ID: 0,
        Username: "",
        Email: "",
        Password: "",
        FirstName: "",
        LastName: "",
        Position: "",
        PhoneNumber: "",
        Occupation: "",
        IsActive: false,
        IsStaff: false,
        IsSuperUser: false,
        Paid: false,
        LastLogin: "",
        DateJoined: "",
      });
    }
  }, [show]);

  const handleUserSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const newUsername = e.target.value;
    setSelectedUsername(newUsername);

    const selectedUser = users.find(
      (user: User) => user.Username === newUsername
    );
    if (selectedUser) {
      setUserData({
        ID: selectedUser.ID || 0,
        Username: selectedUser.Username || "",
        Email: selectedUser.Email || "",
        Password: "", // Clear password field
        FirstName: selectedUser.FirstName || "",
        LastName: selectedUser.LastName || "",
        Position: selectedUser.Position || "",
        PhoneNumber: selectedUser.PhoneNumber || "",
        Occupation: selectedUser.Occupation || "",
        IsActive: selectedUser.IsActive || false,
        IsStaff: selectedUser.IsStaff || false,
        IsSuperUser: selectedUser.IsSuperUser || false,
        Paid: selectedUser.Paid || false,
        LastLogin: selectedUser.LastLogin || "",
        DateJoined: selectedUser.DateJoined || "",
      });
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, type } = e.target;
    const value =
      type === "checkbox"
        ? (e.target as HTMLInputElement).checked
        : e.target.value;

    setUserData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Update User</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group controlId="formUsername">
            <Form.Label>Select User</Form.Label>
            <Form.Select
              value={selectedUsername || ""}
              onChange={handleUserSelect}
              required
            >
              <option value="">Select a user...</option>
              {users.map((user: User) => (
                <option key={user.ID} value={user.Username || ""}>
                  {user.Username}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="Email"
              placeholder="Enter email"
              value={userData.Email || ""}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="formPassword">
            <Form.Label>Password</Form.Label>
            <Form.Control
              type="password"
              name="Password"
              placeholder="Enter new password (optional)"
              value={userData.Password || ""}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group controlId="formFirstName">
            <Form.Label>First Name</Form.Label>
            <Form.Control
              type="text"
              name="FirstName"
              placeholder="Enter first name"
              value={userData.FirstName || ""}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="formLastName">
            <Form.Label>Last Name</Form.Label>
            <Form.Control
              type="text"
              name="LastName"
              placeholder="Enter last name"
              value={userData.LastName || ""}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group controlId="formPosition">
            <Form.Label>Position</Form.Label>
            <Form.Control
              type="text"
              name="Position"
              placeholder="Enter position"
              value={userData.Position || ""}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group controlId="formPhoneNumber">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              name="PhoneNumber"
              placeholder="Enter phone number"
              value={userData.PhoneNumber || ""}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group controlId="formOccupation">
            <Form.Label>Occupation</Form.Label>
            <Form.Control
              type="text"
              name="Occupation"
              placeholder="Enter occupation"
              value={userData.Occupation || ""}
              onChange={handleChange}
            />
          </Form.Group>

          <br />
          <Form.Group className="checkbox-container">
            <Form.Check
              type="checkbox"
              id="isStaff"
              name="IsStaff"
              label="Staff"
              checked={userData.IsStaff || false}
              onChange={handleChange}
            />
            <Form.Check
              type="checkbox"
              id="isSuperUser"
              name="IsSuperUser"
              label="Super User"
              checked={userData.IsSuperUser || false}
              onChange={handleChange}
            />
            <Form.Check
              type="checkbox"
              id="paid"
              name="Paid"
              label="Paid"
              checked={userData.Paid || false}
              onChange={handleChange}
            />
          </Form.Group>

          <div className="modal-footer">
            <button className="admin-button" type="submit">
              Update User
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default UpdateUserModal;
