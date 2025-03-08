import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { Contact } from "../../interfaces";
import { createContact } from "../../services/api";
import {
  validateEmail,
  validatePhone,
  validateWebsite,
  formatPhoneNumber,
  getValidationError,
} from "../../utils/validation";

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

  const [validationErrors, setValidationErrors] = useState<{
    email: string | null;
    phone_number: string | null;
    website: string | null;
  }>({
    email: null,
    phone_number: null,
    website: null,
  });

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setContact((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate fields as they're typed
    if (["email", "phone_number", "website"].includes(name)) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: getValidationError(name, value),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all fields before submission
    const emailError = getValidationError("email", contact.email);
    const phoneError = getValidationError("phone_number", contact.phone_number);
    const websiteError = contact.website
      ? getValidationError("website", contact.website)
      : null;

    setValidationErrors({
      email: emailError,
      phone_number: phoneError,
      website: websiteError,
    });

    if (emailError || phoneError || (contact.website && websiteError)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Format phone number before sending
      const formattedContact = {
        ...contact,
        phone_number: formatPhoneNumber(contact.phone_number),
      };

      await createContact(formattedContact);
      onHide();
      // Reset form
      setContact({
        full_name: "",
        email: "",
        phone_number: "",
        website: "",
        is_sponsor: false,
        is_vendor: false,
      });
      setValidationErrors({
        email: null,
        phone_number: null,
        website: null,
      });
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
              name="full_name"
              value={contact.full_name}
              onChange={handleChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={contact.email}
              onChange={handleChange}
              isInvalid={!!validationErrors.email}
              required
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.email}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Phone Number</Form.Label>
            <Form.Control
              type="tel"
              name="phone_number"
              value={contact.phone_number}
              onChange={handleChange}
              isInvalid={!!validationErrors.phone_number}
              required
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.phone_number}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Website</Form.Label>
            <Form.Control
              type="url"
              name="website"
              value={contact.website}
              onChange={handleChange}
              isInvalid={!!validationErrors.website}
              placeholder="https://"
            />
            <Form.Control.Feedback type="invalid">
              {validationErrors.website}
            </Form.Control.Feedback>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="is_sponsor"
              label="Is Sponsor"
              checked={contact.is_sponsor}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              name="is_vendor"
              label="Is Vendor"
              checked={contact.is_vendor}
              onChange={handleChange}
            />
          </Form.Group>

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="admin-button" onClick={onHide}>
              Cancel
            </button>
            <button
              type="submit"
              className="admin-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Contact"}
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddContactModal;
