import React, { useState } from "react";
import { Modal, Form, Button } from "react-bootstrap";
import { Question } from "../../interfaces";
import { archiveQuestion } from "../../services/api";

interface ArchiveQuestionModalProps {
  show: boolean;
  onHide: () => void;
  questions: Question[];
}

const ArchiveQuestionModal: React.FC<ArchiveQuestionModalProps> = ({
  show,
  onHide,
  questions,
}) => {
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestionId) return;

    setError(null);
    setIsSubmitting(true);

    try {
      await archiveQuestion(selectedQuestionId);
      onHide();
    } catch (error) {
      console.error("Failed to archive question:", error);
      setError("Failed to archive question. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="custom-modal">
      <Modal.Header closeButton>
        <Modal.Title>Archive Question</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <div className="alert alert-danger">{error}</div>}
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Select Question to Archive</Form.Label>
            <Form.Select
              value={selectedQuestionId}
              onChange={(e) => setSelectedQuestionId(e.target.value)}
              required
            >
              <option value="">Choose a question...</option>
              {questions
                .filter((q) => !q.is_archived)
                .map((question) => (
                  <option key={question.id} value={question.id}>
                    {question.text}
                  </option>
                ))}
            </Form.Select>
          </Form.Group>

          {selectedQuestionId && (
            <div className="alert alert-warning">
              Are you sure you want to archive this question? Archived questions
              will no longer be visible to users but can still be accessed in
              the admin panel.
            </div>
          )}

          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onHide}>
              Cancel
            </Button>
            <Button
              variant="warning"
              type="submit"
              disabled={!selectedQuestionId || isSubmitting}
            >
              {isSubmitting ? "Archiving..." : "Archive Question"}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default ArchiveQuestionModal;
