package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"selo/config"
	"selo/internal/firebase"
	"selo/internal/middleware"
	"selo/internal/models"
	"time"

	"firebase.google.com/go/v4/auth"
)

var cfg *config.Config

func Init(config *config.Config) {
	cfg = config
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	UserRole string `json:"user_role"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	log.Printf("Incoming %s request to %s from %s", r.Method, r.URL.Path, r.RemoteAddr)

	// Set content type for the actual response
	w.Header().Set("Content-Type", "application/json")

	var creds LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Processing login for email: %s", creds.Email)

	// Add timeout context
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	log.Printf("Attempting to verify user in Firebase Auth...")
	// Verify the user exists in Firebase Auth
	userRecord, err := firebase.Auth.GetUserByEmail(ctx, creds.Email)
	if err != nil {
		log.Printf("Error finding user in Firebase Auth: %v", err)
		http.Error(w, "Authentication failed", http.StatusUnauthorized)
		return
	}
	log.Printf("User found in Firebase Auth: %s", userRecord.UID)

	// Get user from Firestore to determine role
	log.Printf("Fetching user data from Firestore...")
	user, err := models.GetUserByEmail(creds.Email)
	if err != nil {
		log.Printf("Error fetching user data from Firestore: %v", err)
		http.Error(w, "Error fetching user data", http.StatusInternalServerError)
		return
	}
	log.Printf("User data fetched from Firestore")

	// Create a custom token for the user
	log.Printf("Creating custom token...")
	token, err := firebase.Auth.CustomToken(ctx, user.UID)
	if err != nil {
		log.Printf("Error creating custom token: %v", err)
		http.Error(w, "Error creating authentication token", http.StatusInternalServerError)
		return
	}
	log.Printf("Custom token created successfully")

	// Determine user role
	var userRole string
	if user.IsSuperuser {
		userRole = "superuser"
	} else if user.IsStaff {
		userRole = "staff"
	} else {
		userRole = "user"
	}

	// Send response
	response := LoginResponse{
		Token:    token,
		UserRole: userRole,
	}

	log.Printf("Login successful for user: %s with role: %s", creds.Email, userRole)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

type SignUpRequest struct {
	Email     string `json:"email"`
	Password  string `json:"password"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

func SignUp(w http.ResponseWriter, r *http.Request) {
	var req SignUpRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create the user in Firebase Auth
	params := (&auth.UserToCreate{}).
		Email(req.Email).
		Password(req.Password).
		DisplayName(req.FirstName + " " + req.LastName)

	authUser, err := firebase.Auth.CreateUser(r.Context(), params)
	if err != nil {
		http.Error(w, "Error creating user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Create the user record in Firestore
	user := &models.User{
		Email:     req.Email,
		FirstName: req.FirstName,
		LastName:  req.LastName,
	}

	err = models.CreateUserRecord(authUser, user)
	if err != nil {
		http.Error(w, "Error creating user record: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func GetUserProfile(w http.ResponseWriter, r *http.Request) {
	// Get the user ID from the context (set by AuthMiddleware)
	token := r.Context().Value(middleware.UserContextKey).(*auth.Token)
	uid := token.UID

	user, err := models.GetUserByUID(uid)
	if err != nil {
		http.Error(w, "Error fetching user profile", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(user)
}
