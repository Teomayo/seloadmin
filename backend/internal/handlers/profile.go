package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"selo/internal/models"

	"firebase.google.com/go/v4/auth"
)

func GetProfile(w http.ResponseWriter, r *http.Request) {
	// Get the user token from context
	token := r.Context().Value("user").(*auth.Token)

	// Get user from Firestore using UID
	user, err := models.GetUserByUID(token.UID)
	if err != nil {
		log.Printf("Error fetching user profile: %v", err)
		http.Error(w, "Error fetching user profile", http.StatusInternalServerError)
		return
	}

	// Create response
	response := struct {
		UID         string `json:"uid"`
		Email       string `json:"email"`
		FirstName   string `json:"first_name"`
		LastName    string `json:"last_name"`
		IsActive    bool   `json:"is_active"`
		IsStaff     bool   `json:"is_staff"`
		IsSuperuser bool   `json:"is_superuser"`
	}{
		UID:         user.UID,
		Email:       user.Email,
		FirstName:   user.FirstName,
		LastName:    user.LastName,
		IsActive:    user.IsActive,
		IsStaff:     user.IsStaff,
		IsSuperuser: user.IsSuperuser,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}
