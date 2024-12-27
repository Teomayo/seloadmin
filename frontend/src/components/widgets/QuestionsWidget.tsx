import React, { useEffect, useState } from "react";
import { getQuestions, getChoices, voteForChoice } from "../../services/api";
import "../../styles/QuestionsWidget.css";

const QuestionsWidget: React.FC = () => {
  interface Question {
    id: number;
    question_text: string;
    voted_users: string[] | null;
  }

  interface Choice {
    id: number;
    choice_text: string;
    question: number;
  }

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [choices, setChoices] = useState<Choice[]>([]);
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
        const filteredQuestions = result.filter((question: Question) => {
          return !votedQuestions.includes(question.id);
        });
        setQuestions(filteredQuestions);
      } catch (error) {
        console.error("Error fetching questions:", error);
        setQuestions([]);
      }
    };

    fetchQuestions();
  }, [votedQuestions]);

  useEffect(() => {
    if (questions.length > 0) {
      const fetchChoices = async () => {
        const result = await getChoices(questions[currentQuestionIndex].id);
        setChoices(result);
      };
      fetchChoices();
    }
  }, [questions, currentQuestionIndex]);

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

  const getChoicesForCurrentQuestion = () => {
    if (!currentQuestion) return [];
    return choices.filter(
      (choice: Choice) => choice.question === currentQuestion.id
    );
  };

  return (
    <div className="widget">
      <h2>Questions</h2>
      {questions.length > 0 ? (
        currentQuestion && (
          <div>
            <h3>{currentQuestion.question_text}</h3>
            <ul>
              {getChoicesForCurrentQuestion().map((choice: Choice) => (
                <li key={choice.id}>
                  <button
                    onClick={() => handleVote(choice.id)}
                    disabled={hasVoted}
                  >
                    {choice.choice_text}
                  </button>
                </li>
              ))}
            </ul>
            <div className="navigation-buttons">
              <button
                onClick={handlePreviousQuestion}
                disabled={currentQuestionIndex === 0}
              >
                Previous
              </button>
              <button
                onClick={handleNextQuestion}
                disabled={currentQuestionIndex === questions.length - 1}
              >
                Next
              </button>
            </div>
          </div>
        )
      ) : (
        <p>No more questions available.</p>
      )}
    </div>
  );
};

export default QuestionsWidget;
