import React, { useEffect, useState } from "react";
import { getMembersCount } from "../../services/api";
import "../../styles/widgets/MembersWidget.css";
const MembersWidget: React.FC = () => {
  const [membersCount, setMembersCount] = useState(0);

  useEffect(() => {
    const fetchMembersCount = async () => {
      try {
        const count = await getMembersCount();
        setMembersCount(count);
      } catch (error) {
        console.error("Error fetching members count:", error);
      }
    };

    fetchMembersCount();
  }, []);

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
