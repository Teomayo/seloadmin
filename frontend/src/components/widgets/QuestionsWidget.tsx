import React, { useEffect, useState } from "react";
import { getQuestions, voteForChoice } from "../../services/api";
import "../../styles/widgets/QuestionsWidget.css";

interface Choice {
  id: number;
  text: string;
  votes: number;
  question_id: number;
}

interface Question {
  id: number;
  text: string;
  created_at: string;
  choices: Choice[];
  voted_users: string[];
}

const QuestionsWidget: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const userName = localStorage.getItem("userName");

  const [votedQuestions, setVotedQuestions] = useState<number[]>(() => {
    const savedVotedQuestions = sessionStorage.getItem("votedQuestions");
    return savedVotedQuestions ? JSON.parse(savedVotedQuestions) : [];
  });

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const result = await getQuestions();
        console.log("Raw API response:", result);

        if (Array.isArray(result)) {
          const validQuestions = result.filter((question: Question) => {
            console.log("Processing question:", question);
            console.log("Question choices:", question.choices);

            if (!question.choices || !Array.isArray(question.choices)) {
              console.warn(`Question ${question.id} has no choices array`);
              return false;
            }

            const hasInvalidChoices = question.choices.some((choice) => {
              console.log("Checking choice:", choice);
              return !choice.id;
            });

            if (hasInvalidChoices) {
              console.warn(`Question ${question.id} has choices without IDs`);
            }
            return !hasInvalidChoices && !votedQuestions.includes(question.id);
          });

          console.log("Valid questions:", validQuestions);
          setQuestions(validQuestions);
        } else {
          console.error("Expected array of questions, got:", typeof result);
          setQuestions([]);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        setQuestions([]);
      }
    };

    fetchQuestions();
  }, [votedQuestions]);

  useEffect(() => {
    if (
      questions[currentQuestionIndex] &&
      questions[currentQuestionIndex].voted_users &&
      userName &&
      questions[currentQuestionIndex].voted_users?.includes(userName)
    ) {
      setHasVoted(true);
    } else {
      setHasVoted(false);
    }
  }, [currentQuestionIndex, questions, userName]);

  const currentQuestion = questions[currentQuestionIndex];

  const handleVote = async (choiceId: number) => {
    if (hasVoted) return;
    const response = await voteForChoice(choiceId);
    if (response.status === 200) {
      setHasVoted(true);
      const updatedQuestions = questions.filter(
        (question) => question.id !== currentQuestion.id
      );
      setQuestions(updatedQuestions);
      setCurrentQuestionIndex((prev: number) =>
        prev >= updatedQuestions.length ? 0 : prev
      );

      // Update votedQuestions
      const updatedVotedQuestions = [...votedQuestions, currentQuestion.id];
      setVotedQuestions(updatedVotedQuestions);
      sessionStorage.setItem(
        "votedQuestions",
        JSON.stringify(updatedVotedQuestions)
      );
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  return (
    <div className="questions-widget">
      <h2>Questions</h2>
      {questions.length > 0 ? (
        currentQuestion && (
          <div className="questions-content">
            <h3 className="question-title">{currentQuestion.text}</h3>
            <ul className="options-list">
              {currentQuestion.choices.map((choice: Choice, index: number) => (
                <li
                  key={`choice-${
                    choice.id || `${currentQuestion.id}-${index}`
                  }`}
                >
                  <button
                    onClick={() => handleVote(choice.id)}
                    disabled={hasVoted}
                    className="option-item"
                  >
                    {choice.text}
                  </button>
                </li>
              ))}
            </ul>
            <div className="navigation-buttons">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
                className="nav-button"
              >
                Previous
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
                className="nav-button"
              >
                Next
              </button>
            </div>
          </div>
        )
      ) : (
        <p className="no-questions">No more questions available.</p>
      )}
    </div>
  );
};

export default QuestionsWidget;
