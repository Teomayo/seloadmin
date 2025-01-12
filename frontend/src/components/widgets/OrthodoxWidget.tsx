import React, { useState, useEffect } from "react";
import "../../styles/widgets/OrthodoxWidget.css";
import {
  fetchBiblePassage,
  formatReference,
} from "../../services/orthodoxService";
interface DailyReadings {
  date: string;
  feast?: string;
  readings: {
    epistle?: {
      reference: string;
      text: string;
    };
    gospel?: {
      reference: string;
      text: string;
    };
  };
}

const OrthodoxWidget: React.FC = () => {
  const [dailyData, setDailyData] = useState<DailyReadings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDailyReadings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // TODO: These references should come from an Orthodox calendar API
        // These are just examples for now
        const [epistle, gospel] = await Promise.all([
          fetchBiblePassage(formatReference("Ephesians 4:1-6")),
          fetchBiblePassage(formatReference("John 17:1-13")),
        ]);

        setDailyData({
          date: new Date().toISOString(),
          feast: "Today's Feast", // This should also come from Orthodox calendar
          readings: {
            epistle: {
              reference: epistle.reference,
              text: epistle.text,
            },
            gospel: {
              reference: gospel.reference,
              text: gospel.text,
            },
          },
        });
      } catch (error) {
        console.error("Error loading Orthodox readings:", error);
        setError("Failed to load daily readings");
      } finally {
        setIsLoading(false);
      }
    };

    loadDailyReadings();
  }, []);

  if (isLoading) {
    return <div className="orthodox-widget loading">Loading...</div>;
  }

  if (error) {
    return <div className="orthodox-widget error">{error}</div>;
  }

  return (
    <div className="orthodox-widget">
      {dailyData && (
        <>
          <div className="feast-day">
            {dailyData.feast && <h3>{dailyData.feast}</h3>}
          </div>

          <div className="daily-readings">
            <h3>Today's Readings</h3>
            {dailyData.readings.epistle && (
              <div className="reading epistle">
                <h4>Epistle</h4>
                <p className="reference">
                  {dailyData.readings.epistle.reference}
                </p>
                <p className="text">{dailyData.readings.epistle.text}</p>
              </div>
            )}
            {dailyData.readings.gospel && (
              <div className="reading gospel">
                <h4>Gospel</h4>
                <p className="reference">
                  {dailyData.readings.gospel.reference}
                </p>
                <p className="text">{dailyData.readings.gospel.text}</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default OrthodoxWidget;
