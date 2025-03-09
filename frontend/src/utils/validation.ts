// Regular expressions for validation
export const EMAIL_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone number regex that accepts formats:
// (123) 456-7890
// 123-456-7890
// 123.456.7890
// 1234567890
export const PHONE_REGEX =
  /^(\+\d{1,2}\s?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

// Website regex that requires http:// or https:// prefix
export const WEBSITE_REGEX =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone);
};

export const validateWebsite = (website: string): boolean => {
  return WEBSITE_REGEX.test(website);
};

// Format phone number to (XXX) XXX-XXXX
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length !== 10) return phone;

  return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
};

// Validate that at least one contact method (email or phone) is present
export const validateContactMethods = (
  email: string,
  phone: string
): string | null => {
  if (!email && !phone) {
    return "At least one contact method (email or phone number) is required";
  }
  return null;
};

// Helper function to show validation error messages
export const getValidationError = (
  field: string,
  value: string,
  additionalData?: { email?: string; phone_number?: string }
): string | null => {
  switch (field) {
    case "email":
      if (!value) {
        // If email is empty, check if phone exists
        if (additionalData?.phone_number) {
          return null;
        }
        return "Email is required when phone number is not provided";
      }
      return validateEmail(value) ? null : "Please enter a valid email address";
    case "phone":
    case "phone_number":
      if (!value) {
        // If phone is empty, check if email exists
        if (additionalData?.email) {
          return null;
        }
        return "Phone number is required when email is not provided";
      }
      return validatePhone(value) ? null : "Please enter a valid phone number";
    case "website":
    case "web_url":
      return value
        ? validateWebsite(value)
          ? null
          : "Please enter a valid website URL (must start with http:// or https://)"
        : null;
    default:
      return null;
  }
};
