import React, { useEffect, useState } from "react";
import { getMembersCount } from "../../services/api";
import "../../styles/widgets/MembersWidget.css";
const MembersWidget: React.FC = () => {
  const [membersCount, setMembersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembersCount = async () => {
      try {
        setLoading(true);
        setError(null);
        // Add a small delay to ensure auth is initialized
        const count = await getMembersCount();
        setMembersCount(count);
      } catch (error) {
        console.error("Error fetching members count:", error);
        setError("Failed to load members count");
      } finally {
        setLoading(false);
      }
    };
    // Add a small delay to ensure auth is initialized
    const timer = setTimeout(() => {
      fetchMembersCount();
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="members-widget">
        <h3>Members</h3>
        <div>Loading members count...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="members-widget">
        <h3>Members</h3>
        <div className="error-message">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="members-widget">
      <h3>Members</h3>
      <div className="members-content">
        <div className="member-count">
          <span className="count">{membersCount}</span>
          <span className="label">Active Members</span>
        </div>
      </div>
    </div>
  );
};

export default MembersWidget;
