import React, { useState, useEffect } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import "../styles/WidgetGrid.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface WidgetGridProps {
  children: React.ReactNode[];
}

const WidgetGrid: React.FC<WidgetGridProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Default layout for widgets
  const layout = {
    lg: children.map((_, i) => ({
      i: i.toString(),
      x: (i % 2) * 6,
      y: Math.floor(i / 2),
      w: 6,
      h: 4,
    })),
  };

  if (isMobile) {
    return <div className="widget-grid-mobile">{children}</div>;
  }

  return (
    <ResponsiveGridLayout
      className="widget-grid"
      layouts={layout}
      breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
      cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
      rowHeight={100}
      isDraggable={true}
      isResizable={true}
      margin={[16, 16]}
    >
      {children.map((child, index) => (
        <div key={index.toString()} className="widget-container">
          {child}
        </div>
      ))}
    </ResponsiveGridLayout>
  );
};

export default WidgetGrid;
