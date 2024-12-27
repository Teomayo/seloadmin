import React, { useEffect, useState } from "react";
import QuestionsWidget from "./widgets/QuestionsWidget";
import MembersWidget from "./widgets/MembersWidget";
import Layout from "./Layout";
import "../styles/Dashboard.css";

const Dashboard: React.FC = () => {
  const [theme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Layout>
      <div className="dashboard-container">
        <div className="dashboard">
          <div className="widgets-container">
            <QuestionsWidget />
            <MembersWidget />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
