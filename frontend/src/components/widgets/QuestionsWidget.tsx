import React, { useEffect, useState } from "react";
import { getQuestions, voteForChoice } from "../../services/api";
import "../../styles/widgets/QuestionsWidget.css";

interface Choice {
  id: string;
  text: string;
  votes: number;
  question_id: string;
}

interface Question {
  id: string;
  text: string;
  created_at: string;
  choices: Choice[];
  voted_users: string[];
  is_archived?: boolean;
}

const stopPropogation = (event: React.MouseEvent<HTMLButtonElement>) => {
  event.stopPropagation();
};

const QuestionsWidget: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const userName = localStorage.getItem("userName");

  const [votedQuestions, setVotedQuestions] = useState<string[]>(() => {
    const savedVotedQuestions = sessionStorage.getItem("votedQuestions");
    return savedVotedQuestions ? JSON.parse(savedVotedQuestions) : [];
  });

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await getQuestions();

        if (Array.isArray(result)) {
          const validQuestions = result.filter((question: Question) => {
            // Skip archived questions
            if (question.is_archived) {
              return false;
            }

            if (!question.choices || !Array.isArray(question.choices)) {
              console.warn(`Question ${question.id} has no choices array`);
              return false;
            }

            const hasInvalidChoices = question.choices.some((choice) => {
              return !choice.id;
            });

            if (hasInvalidChoices) {
              console.warn(`Question ${question.id} has choices without IDs`);
            }
            return !hasInvalidChoices && !votedQuestions.includes(question.id);
          });

          setQuestions(validQuestions);
        } else {
          console.error("Expected array of questions, got:", typeof result);
          setError("Invalid data format received");
          setQuestions([]);
        }
      } catch (error) {
        console.error("Error fetching questions:", error);
        setError("Failed to load questions");
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to ensure auth is initialized
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 100);

    return () => clearTimeout(timer);
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

  const handleVote = async (
    choiceId: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    stopPropogation(event);
    if (hasVoted) return;
    console.log("Voting for choice:", choiceId);
    try {
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

        // Update votedQuestions with string IDs
        const updatedVotedQuestions = [...votedQuestions, currentQuestion.id];
        setVotedQuestions(updatedVotedQuestions);
        sessionStorage.setItem(
          "votedQuestions",
          JSON.stringify(updatedVotedQuestions)
        );
      }
    } catch (error) {
      console.error("Error voting:", error);
    }
  };

  const handleNextQuestion = (event: React.MouseEvent<HTMLButtonElement>) => {
    stopPropogation(event);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePreviousQuestion = (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    stopPropogation(event);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="questions-widget">
        <h2>Questions</h2>
        <div>Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="questions-widget">
        <h2>Questions</h2>
        <div>Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="questions-widget">
      <h2>Questions</h2>
      {questions.length > 0 ? (
        currentQuestion && (
          <div className="questions-content">
            <h3 className="question-title">{currentQuestion.text}</h3>
            <ul className="options-list">
              {currentQuestion.choices.map((choice: Choice) => (
                <li key={choice.id}>
                  <button
                    onClick={(event) => handleVote(choice.id, event)}
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
                onClick={(event) => handlePreviousQuestion(event)}
                disabled={currentQuestionIndex === 0}
                className="nav-button"
              >
                Previous
              </button>
              <button
                onClick={(event) => handleNextQuestion(event)}
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
