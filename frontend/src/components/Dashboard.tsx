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
  const [layouts, setLayouts] = useState(() => {
    try {
      const savedLayouts = localStorage.getItem("dashboardLayouts");
      if (savedLayouts) {
        return JSON.parse(savedLayouts);
      }
    } catch (error) {
      console.error("Error parsing saved layouts:", error);
    }
    return null;
  });

  const [widgetSettings, setWidgetSettings] = useState(() => {
    try {
      const savedSettings = localStorage.getItem("widgetSettings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        console.log("Initial widget settings from localStorage:", parsed);
        return parsed;
      }
    } catch (error) {
      console.error("Error parsing widget settings:", error);
    }
    return {
      orthodox: true,
      questions: true,
      members: true,
    };
  });

  useEffect(() => {
    setMounted(true);
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 768);
    };

    const handleWidgetSettingsUpdate = (event: CustomEvent<any>) => {
      console.log("Widget settings update event received:", event.detail);
      setWidgetSettings(event.detail);
    };

    // Check for settings in localStorage on mount
    const savedSettings = localStorage.getItem("widgetSettings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        console.log("Loading saved widget settings on mount:", parsed);
        setWidgetSettings(parsed);
      } catch (error) {
        console.error("Error parsing saved widget settings:", error);
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener(
      "widgetSettingsUpdated",
      handleWidgetSettingsUpdate as EventListener
    );

    // Initial resize check
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener(
        "widgetSettingsUpdated",
        handleWidgetSettingsUpdate as EventListener
      );
    };
  }, []);

  // Add effect to sync with localStorage changes
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "widgetSettings" && e.newValue) {
        try {
          const newSettings = JSON.parse(e.newValue);
          console.log("Widget settings changed in localStorage:", newSettings);
          setWidgetSettings(newSettings);
        } catch (error) {
          console.error(
            "Error parsing widget settings from storage event:",
            error
          );
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const getActiveLayouts = () => {
    if (layouts) return layouts;

    const activeWidgets = [];
    if (widgetSettings.orthodox)
      activeWidgets.push({ i: "orthodox", x: 0, y: 0, w: 4, h: 6 });
    if (widgetSettings.questions)
      activeWidgets.push({ i: "questions", x: 4, y: 0, w: 4, h: 4 });
    if (widgetSettings.members)
      activeWidgets.push({ i: "members", x: 4, y: 3, w: 2, h: 2 });
    return { lg: activeWidgets };
  };

  const handleLayoutChange = (layout: any, layouts: any) => {
    // Save the layouts to localStorage
    localStorage.setItem("dashboardLayouts", JSON.stringify(layouts));
    setLayouts(layouts);
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

  // Calculate maxRows based on viewport height
  const viewportHeight = window.innerHeight;
  const rowHeight = 100;
  const marginY = 16;
  const maxRows = Math.floor(
    (viewportHeight - marginY) / (rowHeight + marginY)
  );

  return (
    <div className="dashboard">
      <ResponsiveGridLayout
        className="layout"
        layouts={getActiveLayouts()}
        breakpoints={{ lg: 1200 }}
        cols={{ lg: 12 }}
        rowHeight={100}
        isDraggable={true}
        isResizable={!isMobileView}
        margin={[16, 16]}
        maxRows={maxRows}
        preventCollision={true}
        onLayoutChange={handleLayoutChange}
        compactType="vertical"
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
