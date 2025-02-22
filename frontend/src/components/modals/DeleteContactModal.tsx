import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { Contact } from "../../interfaces";
import { deleteContact } from "../../services/api";

interface DeleteContactModalProps {
  show: boolean;
  onHide: () => void;
  contacts: Contact[];
}

const DeleteContactModal: React.FC<DeleteContactModalProps> = ({
  show,
  onHide,
  contacts,
}) => {
  const [selectedContactId, setSelectedContactId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await deleteContact(selectedContactId);
      onHide();
    } catch (error) {
      console.error("Failed to delete contact:", error);
      setError("Failed to delete contact. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Delete Contact</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Select Contact to Delete</Form.Label>
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
            <div className="alert alert-danger">
              Are you sure you want to delete this contact? This action cannot
              be undone.
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button
              variant="danger"
              type="submit"
              disabled={!selectedContactId || isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Contact"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default DeleteContactModal;
