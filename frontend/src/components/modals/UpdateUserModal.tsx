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
  const [selectedUID, setSelectedUID] = useState("");
  const [userData, setUserData] = useState<User>({
    uid: "",
    email: "",
    first_name: "",
    last_name: "",
    position: "",
    phone_number: "",
    occupation: "",
    is_active: false,
    is_staff: false,
    is_superuser: false,
    paid: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser(userData.uid, userData);
    alert("User updated successfully!");
    onHide();
  };

  useEffect(() => {
    if (!show) {
      setSelectedUID("");
      setUserData({
        uid: "",
        email: "",
        first_name: "",
        last_name: "",
        position: "",
        phone_number: "",
        occupation: "",
        is_active: false,
        is_staff: false,
        is_superuser: false,
        paid: false,
      });
    }
  }, [show]);

  const handleUserSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const newUID = e.target.value;
    setSelectedUID(newUID);

    const selectedUser = users.find((user: User) => user.uid === newUID);
    if (selectedUser) {
      setUserData({
        ...selectedUser,
        // Don't include password in the form data
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
          <Form.Group controlId="formUID">
            <Form.Label>Select User</Form.Label>
            <Form.Select
              value={selectedUID}
              onChange={handleUserSelect}
              required
            >
              <option value="">Select a user...</option>
              {users.map((user: User) => (
                <option key={user.uid} value={user.uid}>
                  {user.email} ({user.first_name} {user.last_name})
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          <Form.Group controlId="formEmail">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              placeholder="Enter email"
              value={userData.email || ""}
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

          <Form.Group controlId="formPhoneNumber">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="text"
              name="phone_number"
              placeholder="Enter phone number"
              value={userData.phone_number || ""}
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
