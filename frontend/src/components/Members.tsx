import React, { useEffect, useState } from "react";
import "../styles/Members.css"; // Create a CSS file for styling
import { getMembers } from "../services/api";
import { Contact, Member } from "../interfaces";
import { auth } from "../services/firebase";

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMembers, setExpandedMembers] = useState<number[]>([]); // Track expanded members
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortColumn, setSortColumn] = useState<string>("first_name");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768); // Track mobile viewport

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        console.log("Fetching members with params:", {
          currentPage,
          pageSize,
          sortColumn,
          sortOrder,
        });

        await new Promise((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((user: any) => {
            console.log(
              "Auth state changed, user:",
              user ? "authenticated" : "not authenticated"
            );
            unsubscribe();
            resolve(user);
          });
        });

        const response = await getMembers(
          currentPage,
          pageSize,
          "", // Remove searchTerm from API call
          sortColumn,
          sortOrder
        );

        console.log("API Response:", response);

        if (response && response.members) {
          console.log("Setting members:", response.members);
          setMembers(response.members);
          setTotalPages(response.totalPages || 1);
          setTotalCount(response.totalCount || 0);
        } else {
          console.log("No members data in response");
          setMembers([]);
          setTotalPages(1);
          setTotalCount(0);
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        setMembers([]);
        setTotalPages(1);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, [currentPage, pageSize, sortColumn, sortOrder]); // Remove searchTerm from dependencies

  // Add client-side filtering for search
  const filteredMembers = (members || []).filter((member) => {
    if (searchTerm.trim() === "") return true;

    const searchLower = searchTerm.toLowerCase().trim();
    return (
      member.first_name.toLowerCase().includes(searchLower) ||
      member.last_name.toLowerCase().includes(searchLower) ||
      member.email.toLowerCase().includes(searchLower) ||
      member.phone_number.toLowerCase().includes(searchLower) ||
      member.position.toLowerCase().includes(searchLower) ||
      member.occupation.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newSize = parseInt(event.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1);
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

    const buttons = [];
    const maxVisiblePages = 7;

    let startPage = 1;
    let endPage = totalPages;

    if (totalPages > maxVisiblePages) {
      const leftOffset = Math.floor(maxVisiblePages / 2);
      const rightOffset = maxVisiblePages - leftOffset - 1;

      if (currentPage <= leftOffset) {
        endPage = maxVisiblePages - 1;
      } else if (currentPage >= totalPages - rightOffset) {
        startPage = totalPages - maxVisiblePages + 2;
      } else {
        startPage = currentPage - leftOffset + 1;
        endPage = currentPage + rightOffset - 1;
      }

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

    buttons.push(
      <button
        key={1}
        className={`pagination-button ${currentPage === 1 ? "active" : ""}`}
        onClick={() => handlePageChange(1)}
      >
        1
      </button>
    );

    if (startPage > 2) {
      buttons.push(
        <span key="ellipsis-1" className="pagination-ellipsis">
          ...
        </span>
      );
    }

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

    if (endPage < totalPages - 1) {
      buttons.push(
        <span key="ellipsis-2" className="pagination-ellipsis">
          ...
        </span>
      );
    }

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

  const handleToggle = (id: number) => {
    setExpandedMembers((prev) =>
      prev.includes(id)
        ? prev.filter((memberId) => memberId !== id)
        : [...prev, id]
    );
  };

  const handleSort = (column: string) => {
    const newSortOrder =
      sortColumn === column && sortOrder === "asc" ? "desc" : "asc";
    setSortColumn(column);
    setSortOrder(newSortOrder);
    setCurrentPage(1); // Reset to first page when sorting
  };

  return (
    <div className="members-container">
      <h2>Members</h2>
      <div className="filters-container">
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
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
          {filteredMembers.map((member) => (
            <div key={member.uid} className="member-card">
              <div
                className="member-header"
                onClick={() => handleToggle(member.uid)}
              >
                <h3>
                  {member.first_name} {member.last_name}
                </h3>
                <span
                  className={`dropdown-arrow ${
                    expandedMembers.includes(member.uid) ? "expanded" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              {expandedMembers.includes(member.uid) && (
                <div className="member-details">
                  <p>
                    Email: <a href={`mailto:${member.email}`}>{member.email}</a>
                  </p>
                  <p>
                    Phone Number:{" "}
                    <a href={`tel:${member.phone_number}`}>
                      {member.phone_number}
                    </a>
                  </p>
                  <p>Occupation: {member.occupation}</p>
                  <p>Status: {member.paid ? "Paid" : "Unpaid"}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // Table view for larger screens
        <table className="members-table">
          <thead>
            <tr>
              <th onClick={() => handleSort("first_name")}>
                First Name{" "}
                {sortColumn === "first_name"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th onClick={() => handleSort("last_name")}>
                Last Name{" "}
                {sortColumn === "last_name"
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
              <th onClick={() => handleSort("position")}>
                Position{" "}
                {sortColumn === "position"
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
              <th onClick={() => handleSort("occupation")}>
                Occupation{" "}
                {sortColumn === "occupation"
                  ? sortOrder === "asc"
                    ? "↑"
                    : "↓"
                  : ""}
              </th>
              <th onClick={() => handleSort("paid")}>
                Paid{" "}
                {sortColumn === "paid" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.map((member) => (
              <tr key={member.uid}>
                <td>{member.first_name}</td>
                <td>{member.last_name}</td>
                <td>
                  <a href={`mailto:${member.email}`}>{member.email}</a>
                </td>
                <td>{member.position}</td>
                <td>
                  <a href={`tel:${member.phone_number}`}>
                    {member.phone_number}
                  </a>
                </td>
                <td>{member.occupation}</td>
                <td>{member.paid ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Members;
