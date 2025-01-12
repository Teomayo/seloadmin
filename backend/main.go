package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"selo/config"
	"selo/internal/database"
	"selo/internal/handlers"
	"selo/internal/middleware"
	"selo/internal/models"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Load config
	config, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize handlers with config
	handlers.Init(config)

	// Initialize database
	db, err := database.InitDB()
	if err != nil {
		log.Fatal("Cannot connect to database:", err)
	}

	// Auto migrate the schema
	err = db.AutoMigrate(&models.User{}, &models.Question{}, &models.Choice{})
	if err != nil {
		log.Fatal("Cannot migrate database:", err)
	}

	// Initialize router
	r := mux.NewRouter()

	// Public routes
	r.HandleFunc("/api-token-auth/", handlers.Login).Methods("POST", "OPTIONS")
	r.HandleFunc("/api/members/count/", handlers.GetMembersCount).Methods("GET", "OPTIONS")

	// Protected routes
	api := r.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware)
	api.HandleFunc("/questions/", handlers.GetQuestions).Methods("GET", "OPTIONS")
	api.HandleFunc("/questions/{id}/choices/", handlers.GetChoices).Methods("GET", "OPTIONS")
	api.HandleFunc("/choices/{id}/vote/", handlers.VoteForChoice).Methods("POST", "OPTIONS")

	// Get frontend URL from environment variable, default to localhost:3000
	frontendURL := os.Getenv("FRONTEND_URL")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	}

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{frontendURL},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Wrap router with CORS middleware
	handler := c.Handler(r)

	// Get host from environment variable, default to localhost
	host := os.Getenv("SERVER_HOST")
	if host == "" {
		host = "localhost" // fallback default
	}

	port := os.Getenv("SERVER_PORT")
	if port == "" {
		port = "8080" // fallback default
	}

	address := fmt.Sprintf("%s:%s", host, port)

	// Start server
	log.Printf("Server starting on %s", address)
	if err := http.ListenAndServe(address, handler); err != nil {
		log.Fatal(err)
	}
}
