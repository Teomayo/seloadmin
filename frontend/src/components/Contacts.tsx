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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        // Wait for Firebase Auth to initialize
        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user: any) => {
            unsubscribe();
            resolve(user);
          });
        });

        // Only fetch from API without search term
        const response = await getContacts(currentPage, pageSize, "");
        if (response && response.contacts) {
          setContacts(response.contacts);
          setTotalPages(response.totalPages || 1);
          setTotalCount(response.totalCount || 0);
        } else {
          setContacts([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } catch (error) {
        console.error("Error fetching contacts:", error);
        setContacts([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchContacts();
  }, [currentPage, pageSize]); // Remove searchTerm from dependencies

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredContacts = (contacts || []).filter((contact) => {
    // First apply vendor/sponsor filters
    if (showVendorsOnly && !contact.is_vendor) return false;
    if (showSponsorsOnly && !contact.is_sponsor) return false;

    // Then apply search term filter if there is one
    if (searchTerm.trim() !== "") {
      const searchLower = searchTerm.toLowerCase().trim();
      return (
        contact.full_name.toLowerCase().includes(searchLower) ||
        contact.email.toLowerCase().includes(searchLower) ||
        contact.phone_number.toLowerCase().includes(searchLower) ||
        contact.website.toLowerCase().includes(searchLower) ||
        (contact.notes && contact.notes.toLowerCase().includes(searchLower)) ||
        (contact.is_sponsor && "sponsor".includes(searchLower)) ||
        (contact.is_vendor && "vendor".includes(searchLower))
      );
    }

    return true;
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

    const compareResult = String(aValue || "").localeCompare(
      String(bValue || "")
    );
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

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const renderPaginationButtons = () => {
    if (isMobile) {
      return (
        <>
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Back
          </button>
          <span className="pagination-current">
            {(currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
          </span>
          <button
            className="pagination-button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </>
      );
    }

    // Desktop pagination logic remains the same
    const buttons = [];
    const maxVisiblePages = 7;

    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > maxVisiblePages) {
      const leftOffset = Math.floor(maxVisiblePages / 2);
      const rightOffset = maxVisiblePages - leftOffset - 1;

      if (currentPage <= leftOffset) {
        // Near the start
        endPage = maxVisiblePages - 1;
        buttons.push(
          <button
            key="back"
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Back
          </button>
        );
      } else if (currentPage >= totalPages - rightOffset) {
        // Near the end
        startPage = totalPages - maxVisiblePages + 2;
        buttons.push(
          <button
            key="back"
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Back
          </button>
        );
      } else {
        // Middle
        startPage = currentPage - leftOffset + 1;
        endPage = currentPage + rightOffset - 1;
        buttons.push(
          <button
            key="back"
            className="pagination-button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Back
          </button>
        );
      }
    }

    // Add first page button
    buttons.push(
      <button
        key={1}
        className={`pagination-button ${currentPage === 1 ? "active" : ""}`}
        onClick={() => handlePageChange(1)}
      >
        1
      </button>
    );

    // Add ellipsis after first page if needed
    if (startPage > 2) {
      buttons.push(
        <span key="ellipsis-1" className="pagination-ellipsis">
          ...
        </span>
      );
    }

    // Add page buttons
    for (
      let i = Math.max(2, startPage);
      i <= Math.min(endPage, totalPages - 1);
      i++
    ) {
      buttons.push(
        <button
          key={i}
          className={`pagination-button ${currentPage === i ? "active" : ""}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }

    // Add ellipsis before last page if needed
    if (endPage < totalPages - 1) {
      buttons.push(
        <span key="ellipsis-2" className="pagination-ellipsis">
          ...
        </span>
      );
    }

    // Add last page button if there is more than one page
    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          className={`pagination-button ${
            currentPage === totalPages ? "active" : ""
          }`}
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </button>
      );
    }

    // Add Next button
    if (totalPages > maxVisiblePages) {
      buttons.push(
        <button
          key="next"
          className="pagination-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      );
    }

    return buttons;
  };

  return (
    <div className="contacts-container">
      <h2>Contacts</h2>
      <div className="filters-container">
        <input
          type="text"
          placeholder="Search contacts..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
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
        <div className="pagination-controls">
          <div className="pagination-wrapper">
            {!isMobile && (
              <span className="pagination-info">
                {(currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, totalCount)} of {totalCount}
              </span>
            )}
            <div className="pagination-buttons">
              {renderPaginationButtons()}
            </div>
          </div>
          <div className="results-per-page">
            <select
              value={pageSize}
              onChange={handlePageSizeChange}
              className="page-size-select"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
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
                  <p>Notes: {contact.notes || "No notes"}</p>
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
              <th onClick={() => handleSort("notes")}>
                Notes{" "}
                {sortColumn === "notes"
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
                <td>{contact.notes || "No notes"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Contacts;
