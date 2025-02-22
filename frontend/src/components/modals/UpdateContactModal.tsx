import React, { useState, useEffect } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { Contact } from "../../interfaces";
import { updateContact } from "../../services/api";

interface UpdateContactModalProps {
  show: boolean;
  onHide: () => void;
  contacts: Contact[];
}

const UpdateContactModal: React.FC<UpdateContactModalProps> = ({
  show,
  onHide,
  contacts,
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [contact, setContact] = useState<Partial<Contact>>({
    full_name: "",
    email: "",
    phone_number: "",
    website: "",
    is_sponsor: false,
    is_vendor: false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedContactId) {
      const selectedContact = contacts.find((c) => c.id === selectedContactId);
      if (selectedContact) {
        setContact(selectedContact);
      }
    }
  }, [selectedContactId, contacts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await updateContact(selectedContactId, contact);
      onHide();
    } catch (error) {
      console.error("Failed to update contact:", error);
      setError("Failed to update contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Update Contact</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Select Contact</Form.Label>
            <Form.Select
              value={selectedContactId}
              onChange={(e) => setSelectedContactId(e.target.value)}
              required
            >
              <option value="">Choose a contact...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.full_name}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedContactId && (
            <>
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
            </>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={!selectedContactId || isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Contact"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default UpdateContactModal;
