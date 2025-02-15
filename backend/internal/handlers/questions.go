package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"selo/internal/firebase"
	"strings"
	"time"

	"strconv"

	"cloud.google.com/go/firestore"
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
	log.Printf("GetQuestions handler called")

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

		// Log the raw data for debugging
		log.Printf("Raw Firestore data: %+v", doc.Data())

		var question struct {
			Text      string    `firestore:"text,omitempty"`
			CreatedAt time.Time `firestore:"created_at,omitempty"`
			Choices   []struct {
				Text  string `firestore:"text"`
				Votes int64  `firestore:"votes"`
			} `firestore:"choices,omitempty"`
			VotedUsers []string `firestore:"voted_users,omitempty"`
		}

		if err := doc.DataTo(&question); err != nil {
			log.Printf("Error parsing question data for doc %s: %v", doc.Ref.ID, err)
			continue
		}

		// Convert choices to response format
		var choiceResponses []ChoiceResponse
		for idx, c := range question.Choices {
			choiceResponses = append(choiceResponses, ChoiceResponse{
				ID:         fmt.Sprintf("%s_%d", doc.Ref.ID, idx),
				Text:       c.Text,
				Votes:      int(c.Votes),
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
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
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
		Choices map[string]struct {
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
	for idx, c := range question.Choices {
		choices = append(choices, ChoiceResponse{
			ID:         questionID + "_" + idx,
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

	log.Printf("VoteForChoice handler called")
	log.Printf("Request URL: %s", r.URL.Path)
	log.Printf("Request method: %s", r.Method)
	log.Printf("Authorization header: %s", r.Header.Get("Authorization"))

	// Split the choice ID to get question ID and choice index
	parts := strings.Split(choiceIDFull, "_")
	if len(parts) != 2 {
		http.Error(w, "Invalid choice ID format", http.StatusBadRequest)
		return
	}
	questionID := parts[0]
	choiceIndex := parts[1]

	log.Printf("Question ID: %s, Choice Index: %s", questionID, choiceIndex)

	// Get and verify the Firebase token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		http.Error(w, "No authorization header", http.StatusUnauthorized)
		return
	}

	// Remove "Bearer " prefix
	idToken := strings.TrimPrefix(authHeader, "Bearer ")
	auth, err := firebase.App.Auth(ctx)
	if err != nil {
		log.Printf("Error getting Firebase Auth client: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	token, err := auth.VerifyIDToken(ctx, idToken)
	if err != nil {
		log.Printf("Error verifying token: %v", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	email, ok := token.Claims["email"].(string)
	if !ok {
		log.Printf("Failed to get email from token claims")
		http.Error(w, "Invalid token claims", http.StatusUnauthorized)
		return
	}

	log.Printf("User email from verified token: %s", email)

	// Get reference to the question document
	docRef := firebase.FirestoreClient.Collection("questions").Doc(questionID)

	// Start a transaction
	err = firebase.FirestoreClient.RunTransaction(ctx, func(ctx context.Context, tx *firestore.Transaction) error {
		// Get the current document
		doc, err := tx.Get(docRef)
		if err != nil {
			log.Printf("Error getting document: %v", err)
			return err
		}

		// Get the current data
		data := doc.Data()
		log.Printf("Current document data: %+v", data)

		// Extract choices array
		choicesInterface, exists := data["choices"]
		if !exists {
			return fmt.Errorf("choices field not found")
		}

		choices, ok := choicesInterface.([]interface{})
		if !ok {
			return fmt.Errorf("invalid choices format")
		}

		// Validate choice index
		choiceIdx, err := strconv.Atoi(choiceIndex)
		if err != nil {
			return fmt.Errorf("invalid choice index")
		}

		if choiceIdx < 0 || choiceIdx >= len(choices) {
			return fmt.Errorf("invalid choice index")
		}

		// Extract voted_users array
		votedUsersInterface, exists := data["voted_users"]
		var votedUsers []string
		if exists {
			votedUsersArr, ok := votedUsersInterface.([]interface{})
			if ok {
				for _, v := range votedUsersArr {
					if str, ok := v.(string); ok {
						votedUsers = append(votedUsers, str)
					}
				}
			}
		}

		// Check if user already voted
		for _, voter := range votedUsers {
			if voter == email {
				return &customError{"User already voted"}
			}
		}

		// Get the specific choice
		choice, ok := choices[choiceIdx].(map[string]interface{})
		if !ok {
			return fmt.Errorf("invalid choice data format")
		}

		// Increment votes
		currentVotes, ok := choice["votes"].(int64)
		if !ok {
			currentVotes = 0
		}
		choice["votes"] = currentVotes + 1

		// Update choices array
		choices[choiceIdx] = choice

		// Add user to voted list
		votedUsers = append(votedUsers, email)

		// Update the document
		updates := map[string]interface{}{
			"choices":     choices,
			"voted_users": votedUsers,
		}

		return tx.Set(docRef, updates, firestore.MergeAll)
	})

	if err != nil {
		if cerr, ok := err.(*customError); ok {
			http.Error(w, cerr.msg, http.StatusBadRequest)
			return
		}
		log.Printf("Error in transaction: %v", err)
		http.Error(w, "Error processing vote", http.StatusInternalServerError)
		return
	}

	// Send success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"status": "success"})
}

// Custom error type for handling specific error cases
type customError struct {
	msg string
}

func (e *customError) Error() string {
	return e.msg
}
