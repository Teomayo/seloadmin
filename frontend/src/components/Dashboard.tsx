import React, { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../styles/Dashboard.css";
import OrthodoxWidget from "./widgets/OrthodoxWidget";
import QuestionsWidget from "./widgets/QuestionsWidget";
import MembersWidget from "./widgets/MembersWidget";

const ResponsiveGridLayout = WidthProvider(Responsive);

const Dashboard: React.FC = () => {
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
  const [mounted, setMounted] = useState(false);
  const [widgetSettings, setWidgetSettings] = useState(() => {
    const savedSettings = localStorage.getItem("widgetSettings");
    return savedSettings
      ? JSON.parse(savedSettings)
      : {
          orthodox: true,
          questions: true,
          members: true,
        };
  });

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobileView(mobile);
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem("widgetSettings");
      if (savedSettings) {
        setWidgetSettings(JSON.parse(savedSettings));
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getActiveLayouts = () => {
    const activeWidgets = [];
    if (widgetSettings.orthodox)
      activeWidgets.push({ i: "orthodox", x: 0, y: 0, w: 4, h: 6 });
    if (widgetSettings.questions)
      activeWidgets.push({ i: "questions", x: 4, y: 0, w: 4, h: 6 });
    if (widgetSettings.members)
      activeWidgets.push({ i: "members", x: 8, y: 0, w: 4, h: 2 });
    return { lg: activeWidgets };
  };

  if (!mounted) return null;

  if (isMobileView) {
    return (
      <div className="dashboard-mobile">
        {widgetSettings.orthodox && (
          <div className="widget-wrapper">
            <OrthodoxWidget />
          </div>
        )}
        {widgetSettings.questions && (
          <div className="widget-wrapper">
            <QuestionsWidget />
          </div>
        )}
        {widgetSettings.members && (
          <div className="widget-wrapper">
            <MembersWidget />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard">
      <ResponsiveGridLayout
        className="layout"
        layouts={getActiveLayouts()}
        breakpoints={{ lg: 1200 }}
        cols={{ lg: 12 }}
        rowHeight={100}
        isDraggable={!isMobileView}
        isResizable={!isMobileView}
        margin={[16, 16]}
      >
        {widgetSettings.orthodox && (
          <div key="orthodox" className="widget-container">
            <OrthodoxWidget />
          </div>
        )}
        {widgetSettings.questions && (
          <div key="questions" className="widget-container">
            <QuestionsWidget />
          </div>
        )}
        {widgetSettings.members && (
          <div key="members" className="widget-container">
            <MembersWidget />
          </div>
        )}
      </ResponsiveGridLayout>
    </div>
  );
};

export default Dashboard;
