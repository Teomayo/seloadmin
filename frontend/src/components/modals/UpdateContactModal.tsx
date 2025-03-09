import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { Contact } from "../../interfaces";
import { updateContact } from "../../services/api";
import {
  validateEmail,
  validatePhone,
  validateWebsite,
  formatPhoneNumber,
  getValidationError,
} from "../../utils/validation";

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
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [contactData, setContactData] = useState<Contact>({
    id: "",
    full_name: "",
    email: "",
    phone_number: "",
    website: "",
    is_sponsor: false,
    is_vendor: false,
    notes: "",
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

  const handleContactSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const contactId = e.target.value;
    setSelectedContact(contactId);
    const contact = contacts.find((c) => c.id === contactId);
    if (contact) {
      setContactData(contact);
      // Validate initial values
      setValidationErrors({
        email: getValidationError("email", contact.email),
        phone_number: getValidationError("phone_number", contact.phone_number),
        website: contact.website
          ? getValidationError("website", contact.website)
          : null,
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setContactData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    // Validate fields as they're typed
    if (["email", "phone_number", "website"].includes(name)) {
      if (name === "website") {
        setValidationErrors((prev) => ({
          ...prev,
          [name]: getValidationError(name, value),
        }));
      } else {
        // For email and phone, we need to check them together
        const otherField = name === "email" ? "phone_number" : "email";
        const otherValue =
          name === "email" ? contactData.phone_number : contactData.email;

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
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedContact) {
      setError("Please select a contact to update");
      return;
    }

    // Validate all fields before submission
    const emailError = getValidationError("email", contactData.email, {
      phone_number: contactData.phone_number,
    });
    const phoneError = getValidationError(
      "phone_number",
      contactData.phone_number,
      {
        email: contactData.email,
      }
    );
    const websiteError = contactData.website
      ? getValidationError("website", contactData.website)
      : null;

    setValidationErrors({
      email: emailError,
      phone_number: phoneError,
      website: websiteError,
    });

    if (emailError || phoneError || (contactData.website && websiteError)) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Format phone number before sending if it exists
      const formattedData = {
        ...contactData,
        phone_number: contactData.phone_number
          ? formatPhoneNumber(contactData.phone_number)
          : "",
      };

      await updateContact(selectedContact, formattedData);
      alert("Contact updated successfully!");
      onHide();
      // Reset form
      setSelectedContact("");
      setContactData({
        id: "",
        full_name: "",
        email: "",
        phone_number: "",
        website: "",
        is_sponsor: false,
        is_vendor: false,
        notes: "",
      });
      setValidationErrors({
        email: null,
        phone_number: null,
        website: null,
      });
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
          <Form.Group controlId="formContactSelect">
            <Form.Label>Select Contact</Form.Label>
            <Form.Select
              value={selectedContact}
              onChange={handleContactSelect}
              required
            >
              <option value="">Select a contact...</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.full_name} - {contact.email}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedContact && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Full Name</Form.Label>
                <Form.Control
                  type="text"
                  name="full_name"
                  value={contactData.full_name}
                  onChange={handleChange}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Email{" "}
                  {!contactData.phone_number &&
                    "(Required when phone is empty)"}
                </Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={contactData.email}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.email}
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.email}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>
                  Phone Number{" "}
                  {!contactData.email && "(Required when email is empty)"}
                </Form.Label>
                <Form.Control
                  type="tel"
                  name="phone_number"
                  value={contactData.phone_number}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.phone_number}
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
                  value={contactData.website}
                  onChange={handleChange}
                  isInvalid={!!validationErrors.website}
                  placeholder="https://"
                />
                <Form.Control.Feedback type="invalid">
                  {validationErrors.website}
                </Form.Control.Feedback>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Notes</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  name="notes"
                  value={contactData.notes}
                  onChange={handleChange}
                  placeholder="Add any additional notes here..."
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_sponsor"
                  label="Is Sponsor"
                  checked={contactData.is_sponsor}
                  onChange={handleChange}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  name="is_vendor"
                  label="Is Vendor"
                  checked={contactData.is_vendor}
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
                  {isSubmitting ? "Updating..." : "Update Contact"}
                </button>
              </div>
            </>
          )}
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default UpdateContactModal;
