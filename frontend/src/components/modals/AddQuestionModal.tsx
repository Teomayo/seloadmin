import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { createQuestion } from "../../services/api";

interface Choice {
  text: string;
  votes: number;
}

interface AddQuestionModalProps {
  show: boolean;
  onHide: () => void;
}

const AddQuestionModal: React.FC<AddQuestionModalProps> = ({
  show,
  onHide,
}) => {
  const [questionText, setQuestionText] = useState("");
  const [choices, setChoices] = useState<Choice[]>([
    { text: "", votes: 0 },
    { text: "", votes: 0 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddChoice = () => {
    setChoices([...choices, { text: "", votes: 0 }]);
  };

  const handleRemoveChoice = (index: number) => {
    if (choices.length > 2) {
      const newChoices = choices.filter((_, i) => i !== index);
      setChoices(newChoices);
    }
  };

  const handleChoiceChange = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index].text = value;
    setChoices(newChoices);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      await createQuestion({
        text: questionText,
        choices: choices,
        created_at: new Date(),
        voted_users: [],
      });
      onHide();
    } catch (error) {
      console.error("Failed to create question:", error);
      setError("Failed to create question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Add New Question</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
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
                <div className="flex-grow-1">
                  <Form.Control
                    type="text"
                    value={choice.text}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    placeholder={`Choice ${index + 1}`}
                    required
                  />
                </div>
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

          <div className="d-flex justify-content-end gap-2">
            <button type="button" className="admin-button" onClick={onHide}>
              Cancel
            </button>
            <button
              type="submit"
              className="admin-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Adding..." : "Add Question"}
            </button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AddQuestionModal;
