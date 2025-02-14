package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"selo/internal/firebase"
	"selo/internal/middleware"
	"strings"
	"time"

	"cloud.google.com/go/firestore"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"google.golang.org/api/iterator"
)

type ChoiceResponse struct {
	ID         string `json:"id"`
	Text       string `json:"text"`
	Votes      int    `json:"votes"`
	QuestionID string `json:"question_id"`
}

type QuestionResponse struct {
	ID         string           `json:"id"`
	Text       string           `json:"text"`
	CreatedAt  time.Time        `json:"created_at"`
	Choices    []ChoiceResponse `json:"choices"`
	VotedUsers []string         `json:"voted_users"`
}

func GetQuestions(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// Get all questions from Firestore
	iter := firebase.FirestoreClient.Collection("questions").Documents(ctx)
	defer iter.Stop()

	var response []QuestionResponse
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Error iterating questions: %v", err)
			http.Error(w, "Error fetching questions", http.StatusInternalServerError)
			return
		}

		var question struct {
			Text      string    `firestore:"text"`
			CreatedAt time.Time `firestore:"created_at"`
			Choices   []struct {
				Text  string `firestore:"text"`
				Votes int    `firestore:"votes"`
			} `firestore:"choices"`
			VotedUsers []string `firestore:"voted_users"`
		}

		if err := doc.DataTo(&question); err != nil {
			log.Printf("Error parsing question data: %v", err)
			continue
		}

		// Convert choices to response format
		var choiceResponses []ChoiceResponse
		for i, c := range question.Choices {
			choiceResponses = append(choiceResponses, ChoiceResponse{
				ID:         doc.Ref.ID + "_" + string(i), // Create a unique ID for each choice
				Text:       c.Text,
				Votes:      c.Votes,
				QuestionID: doc.Ref.ID,
			})
		}

		response = append(response, QuestionResponse{
			ID:         doc.Ref.ID,
			Text:       question.Text,
			CreatedAt:  question.CreatedAt,
			Choices:    choiceResponses,
			VotedUsers: question.VotedUsers,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetChoices(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	questionID := mux.Vars(r)["id"]

	// Get the question document
	docRef := firebase.FirestoreClient.Collection("questions").Doc(questionID)
	doc, err := docRef.Get(ctx)
	if err != nil {
		log.Printf("Error fetching question: %v", err)
		http.Error(w, "Error fetching choices", http.StatusInternalServerError)
		return
	}

	var question struct {
		Choices []struct {
			Text  string `firestore:"text"`
			Votes int    `firestore:"votes"`
		} `firestore:"choices"`
	}

	if err := doc.DataTo(&question); err != nil {
		log.Printf("Error parsing question data: %v", err)
		http.Error(w, "Error parsing question data", http.StatusInternalServerError)
		return
	}

	// Convert to response format
	var choices []ChoiceResponse
	for i, c := range question.Choices {
		choices = append(choices, ChoiceResponse{
			ID:         questionID + "_" + string(i),
			Text:       c.Text,
			Votes:      c.Votes,
			QuestionID: questionID,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(choices)
}

func VoteForChoice(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	vars := mux.Vars(r)
	choiceIDFull := vars["id"]

	// Split the choice ID to get question ID and choice index
	parts := strings.Split(choiceIDFull, "_")
	if len(parts) != 2 {
		http.Error(w, "Invalid choice ID format", http.StatusBadRequest)
		return
	}
	questionID := parts[0]
	choiceIndex := parts[1]

	// Get username from JWT token
	claims := r.Context().Value(middleware.UserContextKey).(jwt.MapClaims)
	username := claims["username"].(string)

	// Start a transaction
	err := firebase.FirestoreClient.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		docRef := firebase.FirestoreClient.Collection("questions").Doc(questionID)

		// Get the current question data
		doc, err := tx.Get(docRef)
		if err != nil {
			return err
		}

		var question struct {
			Choices    []map[string]interface{} `firestore:"choices"`
			VotedUsers []string                 `firestore:"voted_users"`
		}
		if err := doc.DataTo(&question); err != nil {
			return err
		}

		// Check if user already voted
		for _, voter := range question.VotedUsers {
			if voter == username {
				return &customError{"User already voted"}
			}
		}

		// Update the vote count for the specific choice
		idx := int(choiceIndex[0] - '0') // Convert string index to int
		if idx < 0 || idx >= len(question.Choices) {
			return &customError{"Invalid choice index"}
		}

		// Increment the votes
		question.Choices[idx]["votes"] = question.Choices[idx]["votes"].(int) + 1

		// Add user to voted list
		question.VotedUsers = append(question.VotedUsers, username)

		// Update the document
		return tx.Set(docRef, map[string]interface{}{
			"choices":     question.Choices,
			"voted_users": question.VotedUsers,
		}, firestore.MergeAll)
	})

	if err != nil {
		if cerr, ok := err.(*customError); ok {
			http.Error(w, cerr.msg, http.StatusBadRequest)
		} else {
			log.Printf("Error in transaction: %v", err)
			http.Error(w, "Error processing vote", http.StatusInternalServerError)
		}
		return
	}

	w.WriteHeader(http.StatusOK)
}

// Custom error type for handling specific error cases
type customError struct {
	msg string
}

func (e *customError) Error() string {
	return e.msg
}
