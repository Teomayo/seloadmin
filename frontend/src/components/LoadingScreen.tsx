import React, { useEffect, useState } from "react";
import "../styles/LoadingScreen.css";

interface LoadingScreenProps {
  minDuration?: number;
  onLoadingComplete?: () => void;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  minDuration = 2000,
  onLoadingComplete,
}) => {
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldShow(false);
      if (onLoadingComplete) {
        onLoadingComplete();
      }
    }, minDuration);

    return () => clearTimeout(timer);
  }, [minDuration, onLoadingComplete]);

  if (!shouldShow) return null;

  return (
    <div className="loading-screen">
      <div className="loading-container">
        <img src="/selo-logo.png" alt="SELO Logo" className="spinning-logo" />
        <div className="loading-text">Loading...</div>
      </div>
    </div>
  );
};

export default LoadingScreen;
