package main

import (
	"fmt"
	"log"
	"net/http"
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

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	// Wrap router with CORS middleware
	handler := c.Handler(r)

	// Start server
	serverAddr := fmt.Sprintf(":%s", config.ServerPort)
	log.Printf("Server starting on port %s", config.ServerPort)
	log.Fatal(http.ListenAndServe(serverAddr, handler))
}
