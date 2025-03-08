import React, { useState, useEffect } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { Question } from "../../interfaces";
import { updateQuestion } from "../../services/api";

interface UpdateQuestionModalProps {
  show: boolean;
  onHide: () => void;
  questions: Question[];
}

const UpdateQuestionModal: React.FC<UpdateQuestionModalProps> = ({
  show,
  onHide,
  questions,
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState<{ text: string; votes: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (selectedQuestionId) {
      const question = questions.find((q) => q.id === selectedQuestionId);
      if (question) {
        setQuestionText(question.text);
        setChoices(question.choices);
      }
    }
  }, [selectedQuestionId, questions]);

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = { ...newChoices[index], text: value };
    setChoices(newChoices);
  };

  const handleAddChoice = () => {
    setChoices([...choices, { text: "", votes: 0 }]);
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length > 2) {
      const newChoices = choices.filter((_, i) => i !== index);
      setChoices(newChoices);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionId) return;

    setError(null);
    setIsSubmitting(true);

    // Validate
    if (!questionText.trim()) {
      setError("Question text is required");
      setIsSubmitting(false);
      return;
    }

    if (choices.some((choice) => !choice.text.trim())) {
      setError("All choices must have text");
      setIsSubmitting(false);
      return;
    }

    try {
      await updateQuestion(selectedQuestionId, {
        text: questionText,
        choices: choices,
      });
      onHide();
    } catch (error) {
      console.error("Failed to update question:", error);
      setError("Failed to update question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Update Question</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Select Question</Form.Label>
            <Form.Select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              required
            >
              <option value="">Choose a question...</option>
              {questions.map((question) => (
                <option key={question.id} value={question.id}>
                  {question.text}
                </option>
              ))}
            </Form.Select>
          </Form.Group>

          {selectedQuestionId && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Question Text</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  required
                />
              </Form.Group>

              <div className="mb-3">
                <label className="form-label">Choices</label>
                {choices.map((choice, index) => (
                  <div key={index} className="d-flex mb-2 gap-2">
                    <Form.Control
                      type="text"
                      value={choice.text}
                      onChange={(e) =>
                        handleChoiceChange(index, e.target.value)
                      }
                      placeholder={`Choice ${index + 1}`}
                      required
                    />
                    <span className="text-muted" style={{ minWidth: "80px" }}>
                      Votes: {choice.votes}
                    </span>
                    {choices.length > 2 && (
                      <Button
                        variant="outline-danger"
                        className="h-100"
                        onClick={() => handleRemoveChoice(index)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline-primary"
                  size="sm"
                  onClick={handleAddChoice}
                  className="mt-2"
                >
                  Add Choice
                </Button>
              </div>
            </>
          )}

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="admin-button" onClick={onHide}>
              Cancel
            </button>
            <button
              type="submit"
              className="admin-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Question"}
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default UpdateQuestionModal;
