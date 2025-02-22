import React, { useEffect, useState } from "react";
import "../styles/Contacts.css"; // Create a CSS file for styling
import { getContacts } from "../services/api";
import { Contact } from "../interfaces";
import { auth } from "../services/firebase";

const Contacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showVendorsOnly, setShowVendorsOnly] = useState(false);
  const [showSponsorsOnly, setShowSponsorsOnly] = useState(false);
  const [expandedContacts, setExpandedContacts] = useState<string[]>([]); // Track expanded contacts
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortColumn, setSortColumn] = useState<string>("full_name");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768); // Track mobile viewport

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        // Wait for Firebase Auth to initialize
        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user: any) => {
            unsubscribe();
            resolve(user);
          });
        });

        const response = await getContacts();
        setContacts(response);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchContacts();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredContacts = contacts.filter((contact) => {
    // First apply vendor/sponsor filters
    if (showVendorsOnly && !contact.is_vendor) return false;
    if (showSponsorsOnly && !contact.is_sponsor) return false;

    // Then apply search term filter
    return (
      contact.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.is_sponsor.toString().includes(searchTerm.toLowerCase()) ||
      contact.is_vendor.toString().includes(searchTerm.toLowerCase())
    );
  });

  // Sort the filtered contacts
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    const aValue = a[sortColumn as keyof Contact];
    const bValue = b[sortColumn as keyof Contact];

    if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      return sortOrder === "asc"
        ? aValue === bValue
          ? 0
          : aValue
          ? 1
          : -1
        : aValue === bValue
        ? 0
        : aValue
        ? -1
        : 1;
    }

    const compareResult = String(aValue).localeCompare(String(bValue));
    return sortOrder === "asc" ? compareResult : -compareResult;
  });

  const handleToggle = (id: string) => {
    setExpandedContacts((prev) =>
      prev.includes(id)
        ? prev.filter((contactId) => contactId !== id)
        : [...prev, id]
    );
  };

  const handleSort = (column: string) => {
    const newSortOrder =
      sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(newSortOrder);
  };

  return (
    <div className="contacts-container">
      <h2>Contacts</h2>
      <div className="filters-container">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <div className="toggle-filters">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showVendorsOnly}
              onChange={(e) => {
                setShowVendorsOnly(e.target.checked);
                if (e.target.checked) setShowSponsorsOnly(false);
              }}
            />
            Vendors
          </label>
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={showSponsorsOnly}
              onChange={(e) => {
                setShowSponsorsOnly(e.target.checked);
                if (e.target.checked) setShowVendorsOnly(false);
              }}
            />
            Sponsors
          </label>
        </div>
      </div>
      {loading ? (
        <p>Loading...</p>
      ) : isMobile ? (
        // Mobile view with dropdown arrows
        <div>
          {sortedContacts.map((contact) => (
            <div key={contact.id} className="contact-card">
              <div
                className="contact-header"
                onClick={() => handleToggle(contact.id)}
              >
                <h3>{contact.full_name}</h3>
                <span
                  className={`dropdown-arrow ${
                    expandedContacts.includes(contact.id) ? "expanded" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              {expandedContacts.includes(contact.id) && (
                <div className="contact-details">
                  <p>
                    Email:{" "}
                    <a href={`mailto:${contact.email}`}>{contact.email}</a>
                  </p>
                  <p>
                    Phone Number:{" "}
                    <a href={`tel:${contact.phone_number}`}>
                      {contact.phone_number}
                    </a>
                  </p>
                  <p>
                    Website:{" "}
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {contact.website}
                    </a>
                  </p>
                  <p>Sponsor: {contact.is_sponsor ? "Yes" : "No"}</p>
                  <p>Vendor: {contact.is_vendor ? "Yes" : "No"}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Table view for larger screens (unchanged)
        <table className="contacts-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("full_name")}>
                Full Name{" "}
                {sortColumn === "full_name"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th onClick={() => handleSort("email")}>
                Email{" "}
                {sortColumn === "email"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th onClick={() => handleSort("phone_number")}>
                Phone Number{" "}
                {sortColumn === "phone_number"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th onClick={() => handleSort("website")}>
                Website{" "}
                {sortColumn === "website"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th onClick={() => handleSort("is_sponsor")}>
                Sponsor{" "}
                {sortColumn === "is_sponsor"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th onClick={() => handleSort("is_vendor")}>
                Vendor{" "}
                {sortColumn === "is_vendor"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedContacts.map((contact) => (
              <tr key={contact.id}>
                <td>{contact.full_name}</td>
                <td>
                  <a href={`mailto:${contact.email}`}>{contact.email}</a>
                </td>
                <td>
                  <a href={`tel:${contact.phone_number}`}>
                    {contact.phone_number}
                  </a>
                </td>
                <td>
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {contact.website}
                  </a>
                </td>
                <td>{contact.is_sponsor ? "Yes" : "No"}</td>
                <td>{contact.is_vendor ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Contacts;
