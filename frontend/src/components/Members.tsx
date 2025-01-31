import React, { useEffect, useState } from "react";
import "../styles/Members.css"; // Create a CSS file for styling
import { getMembers } from "../services/api";
import { Member } from "../interfaces";

const Members: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedMembers, setExpandedMembers] = useState<number[]>([]); // Track expanded members
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [sortColumn, setSortColumn] = useState<string>("first_name");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth <= 768); // Track mobile viewport

  useEffect(() => {
    const fetchMembers = async () => {
      const response = await getMembers();
      setMembers(response);
      setLoading(false);
    };
    fetchMembers();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const filteredMembers = members.filter(
    (member) =>
      member.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.phone_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.occupation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.paid.toString().includes(searchTerm.toLowerCase())
  );

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
  };

  return (
    <div className="members-container">
      <h2>Members</h2>
      <input
        type="text"
        placeholder="Search members..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading ? (
        <p>Loading...</p>
      ) : isMobile ? (
        // Mobile view with dropdown arrows
        <div>
          {filteredMembers.map((member) => (
            <div key={member.id} className="member-card">
              <div
                className="member-header"
                onClick={() => handleToggle(member.id)}
              >
                <h3>
                  {member.first_name} {member.last_name}
                </h3>
                <span
                  className={`dropdown-arrow ${
                    expandedMembers.includes(member.id) ? "expanded" : ""
                  }`}
                >
                  ▼
                </span>
              </div>
              {expandedMembers.includes(member.id) && (
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
        // Table view for larger screens (unchanged)
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
              <tr key={member.id}>
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
                <td>{member.paid.toString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Members;
