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
    <div className="widget-small members-widget">
      <h2>Members</h2>
      <p>{membersCount}</p>
    </div>
  );
};

export default MembersWidget;
