package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"os"
	"selo/config"
	"selo/internal/database"
	"selo/internal/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

var cfg *config.Config

func Init(config *config.Config) {
	cfg = config
}

type LoginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type LoginResponse struct {
	Token    string `json:"token"`
	UserRole string `json:"user_role"`
}

func Login(w http.ResponseWriter, r *http.Request) {
	log.Printf("Received login request from: %s", r.RemoteAddr)

	// Check if DB is initialized
	if database.DB == nil {
		log.Printf("ERROR: Database connection is nil!")
		http.Error(w, "Database connection error", http.StatusInternalServerError)
		return
	}

	// Set response headers
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	// Handle preflight
	if r.Method == "OPTIONS" {
		w.WriteHeader(http.StatusOK)
		return
	}

	// Read the entire request body
	body, err := io.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading request body: %v", err)
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}
	// Parse the JSON
	var creds LoginRequest
	err = json.Unmarshal(body, &creds)
	if err != nil {
		log.Printf("Error parsing JSON: %v", err)
		http.Error(w, "Invalid JSON format", http.StatusBadRequest)
		return
	}

	log.Printf("Processing login for user: %s", creds.Username)

	var user models.User
	result := database.DB.Debug().Where("username = ?", creds.Username).First(&user)
	if result.Error != nil {
		log.Printf("Database error finding user: %v", result.Error)
		// Log the SQL query that was executed
		log.Printf("SQL Query: %v", result.Statement.SQL.String())
		// Log the current working directory
		pwd, _ := os.Getwd()
		log.Printf("Current working directory: %s", pwd)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	passwordValid := user.CheckPassword(creds.Password)
	log.Printf("Password check result for user %s: %v", creds.Username, passwordValid)

	if !passwordValid {
		log.Printf("Password check failed for user: %s", creds.Username)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"user_id":  user.ID,
		"username": user.Username,
		"exp":      time.Now().Add(time.Hour * 24).Unix(),
	})

	tokenString, err := token.SignedString([]byte("your-secret-key"))
	if err != nil {
		log.Printf("Error generating token: %v", err)
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	var userRole string
	if user.IsSuperuser {
		userRole = "superuser"
	} else if user.IsStaff {
		userRole = "staff"
	} else {
		userRole = "user"
	}

	w.WriteHeader(http.StatusOK)
	response := LoginResponse{Token: tokenString, UserRole: userRole}
	log.Printf("Sending successful login response for user %s with role %s", creds.Username, userRole)

	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}
