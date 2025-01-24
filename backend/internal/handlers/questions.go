package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"selo/internal/database"
	"selo/internal/middleware"
	"selo/internal/models"
	"strconv"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/mux"
	"gorm.io/gorm"
)

type ChoiceResponse struct {
	ID         uint   `json:"id"`
	Text       string `json:"text"`
	Votes      int    `json:"votes"`
	QuestionID uint   `json:"question_id"`
}

type QuestionResponse struct {
	ID         uint             `json:"id"`
	Text       string           `json:"text"`
	CreatedAt  time.Time        `json:"created_at"`
	Choices    []ChoiceResponse `json:"choices"`
	VotedUsers []string         `json:"voted_users"`
}

func GetQuestions(w http.ResponseWriter, r *http.Request) {
	var questions []models.Question
	result := database.DB.Preload("Choices").Find(&questions)
	if result.Error != nil {
		log.Printf("Error fetching questions: %v", result.Error)
		http.Error(w, "Error fetching questions", http.StatusInternalServerError)
		return
	}

	var response []QuestionResponse
	for _, q := range questions {
		var choiceResponses []ChoiceResponse
		for _, c := range q.Choices {
			choiceResponses = append(choiceResponses, ChoiceResponse{
				ID:         c.ID,
				Text:       c.Text,
				Votes:      c.Votes,
				QuestionID: c.QuestionID,
			})
		}

		votedUsers := strings.Split(q.VotedUsers, ",")
		if votedUsers[0] == "" {
			votedUsers = []string{}
		}

		response = append(response, QuestionResponse{
			ID:         q.ID,
			Text:       q.Text,
			CreatedAt:  q.CreatedAt,
			Choices:    choiceResponses,
			VotedUsers: votedUsers,
		})
	}

	// log.Printf("Sending response: %+v", response)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetChoices(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	questionID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid question ID", http.StatusBadRequest)
		return
	}

	var choices []models.Choice
	result := database.DB.Where("question_id = ?", questionID).Find(&choices)
	if result.Error != nil {
		http.Error(w, "Error fetching choices", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(choices)
}

func VoteForChoice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	choiceID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid choice ID", http.StatusBadRequest)
		return
	}

	// Get username from JWT token
	claims := r.Context().Value(middleware.UserContextKey).(jwt.MapClaims)
	username := claims["username"].(string)

	// Begin transaction
	tx := database.DB.Begin()

	// Get the choice and its associated question
	var choice models.Choice
	if err := tx.First(&choice, choiceID).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Choice not found", http.StatusNotFound)
		return
	}

	var question models.Question
	if err := tx.First(&question, choice.QuestionID).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Question not found", http.StatusNotFound)
		return
	}

	// Check if user already voted
	if question.HasUserVoted(username) {
		tx.Rollback()
		http.Error(w, "User already voted", http.StatusBadRequest)
		return
	}

	// Update vote count and add user to voted list
	if err := tx.Model(&choice).UpdateColumn("votes", gorm.Expr("votes + ?", 1)).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Error updating vote count", http.StatusInternalServerError)
		return
	}

	question.AddVotedUser(username)
	if err := tx.Save(&question).Error; err != nil {
		tx.Rollback()
		http.Error(w, "Error updating voted users", http.StatusInternalServerError)
		return
	}

	// Commit transaction
	tx.Commit()

	w.WriteHeader(http.StatusOK)
}
