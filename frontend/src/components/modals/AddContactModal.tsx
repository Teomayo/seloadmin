import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { Contact } from "../../interfaces";
import { createContact } from "../../services/api";

interface AddContactModalProps {
  show: boolean;
  onHide: () => void;
}

const AddContactModal: React.FC<AddContactModalProps> = ({ show, onHide }) => {
  const [contact, setContact] = useState<Omit<Contact, "id">>({
    full_name: "",
    email: "",
    phone_number: "",
    website: "",
    is_sponsor: false,
    is_vendor: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createContact(contact);
      onHide();
    } catch (error) {
      console.error("Failed to create contact:", error);
      setError("Failed to create contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Add New Contact</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Full Name</Form.Label>
            <Form.Control
              type="text"
              value={contact.full_name}
              onChange={(e) =>
                setContact({ ...contact, full_name: e.target.value })
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              value={contact.email}
              onChange={(e) =>
                setContact({ ...contact, email: e.target.value })
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              value={contact.phone_number}
              onChange={(e) =>
                setContact({ ...contact, phone_number: e.target.value })
              }
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Website</Form.Label>
            <Form.Control
              type="url"
              value={contact.website}
              onChange={(e) =>
                setContact({ ...contact, website: e.target.value })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Is Sponsor"
              checked={contact.is_sponsor}
              onChange={(e) =>
                setContact({ ...contact, is_sponsor: e.target.checked })
              }
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Is Vendor"
              checked={contact.is_vendor}
              onChange={(e) =>
                setContact({ ...contact, is_vendor: e.target.checked })
              }
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Contact"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddContactModal;
