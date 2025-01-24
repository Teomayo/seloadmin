package handlers

import (
	"encoding/json"
	"log"
	"net/http"
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
	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Printf("Error decoding request: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Login attempt for username: %s", req.Username)

	var user models.User
	result := database.DB.Where("username = ?", req.Username).First(&user)
	if result.Error != nil {
		log.Printf("Database error finding user: %v", result.Error)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	if !user.CheckPassword(req.Password) {
		log.Printf("Password check failed for user: %s", req.Username)
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}

	// Create JWT token
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

	json.NewEncoder(w).Encode(LoginResponse{Token: tokenString, UserRole: userRole})
}
