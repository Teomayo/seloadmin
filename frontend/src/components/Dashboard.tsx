import React, { useEffect, useState } from "react";
import QuestionsWidget from "./widgets/QuestionsWidget";
import Layout from "./Layout";

const Dashboard: React.FC = () => {
  const [theme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <Layout>
      <QuestionsWidget />
    </Layout>
  );
};

export default Dashboard;
