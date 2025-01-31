import React, { useState, useEffect } from "react";
import "../../styles/widgets/OrthodoxWidget.css";
import { fetchDailyOrthodoxData } from "../../services/orthodoxService";

interface FastingLevels {
  [key: number]: string;
}

const fastingLevels: FastingLevels = {
  0: "No Fast",
  1: "Regular Fast (Abstain from meat but eggs and dairy are allowed)",
  2: "Fish Allowed (Seafoods are the only animal product one may eat)",
  3: "Oil and Alcohol (No animal products with the exception of invertebrate seafood)",
  4: "Strict Fast (Vegan diet with no oil or alcohol)",
  5: "Xerophagy (Uncooked raw vegan foods, bread can be an exception)",
};

const OrthodoxWidget: React.FC = () => {
  const [dailyData, setDailyData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDailyReadings = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1; // Months are 0-based
        const day = today.getDate();

        const data = await fetchDailyOrthodoxData(year, month, day);
        setDailyData(data);
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
            <h3>{dailyData.summary_title}</h3>
            <p>Fasting Level: {dailyData.fast_level}</p>
            <p>{fastingLevels[dailyData.fast_level]}</p>{" "}
            {/* Displaying the fasting level description */}
            <p>{dailyData.fast_level_description}</p>
          </div>

          {dailyData.saints && (
            <div className="saints">
              <h4>Saints of the Day</h4>
              <ul>
                {dailyData.saints.map((saint: any, index: number) => (
                  <li key={index}>{saint}</li>
                ))}
              </ul>
            </div>
          )}
          <div className="daily-readings">
            <h3>Today's Readings</h3>
            {dailyData.readings &&
              dailyData.readings.map((reading: any, index: number) => (
                <div key={index} className="reading">
                  <h4>{reading.book}</h4>
                  <p className="reference">{reading.display}</p>
                  {reading.passage.map((text: any, index: number) => (
                    <div key={index} className="passage">
                      <h5>
                        {text.chapter}:{text.verse}
                      </h5>
                      <p className="text">{text.content}</p>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
};

export default OrthodoxWidget;
