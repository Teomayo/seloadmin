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

	// Protected routes
	api := r.PathPrefix("/api").Subrouter()
	api.Use(middleware.AuthMiddleware)
	api.HandleFunc("/questions/", handlers.GetQuestions).Methods("GET", "OPTIONS")
	api.HandleFunc("/questions/{id}/choices/", handlers.GetChoices).Methods("GET", "OPTIONS")
	api.HandleFunc("/choices/{id}/vote/", handlers.VoteForChoice).Methods("POST", "OPTIONS")
	api.HandleFunc("/members/{username}/", handlers.UpdateMemberInfo).Methods("PUT", "OPTIONS")
	api.HandleFunc("/create-user/", handlers.CreateUser).Methods("POST", "OPTIONS")
	api.HandleFunc("/delete-user/{username}/", handlers.DeleteUser).Methods("DELETE", "OPTIONS")
	api.HandleFunc("/update-user/{username}/", handlers.UpdateUser).Methods("PUT", "OPTIONS")
	api.HandleFunc("/users/", handlers.GetUsers).Methods("GET", "OPTIONS")
	api.HandleFunc("/members/count/", handlers.GetMembersCount).Methods("GET", "OPTIONS")
	api.HandleFunc("/members/", handlers.GetMembersInfo).Methods("GET", "OPTIONS")
	api.HandleFunc("/members/{username}/", handlers.GetMemberInfo).Methods("GET", "OPTIONS")
	api.HandleFunc("/members/{username}/password/", handlers.UpdateMemberPassword).Methods("PUT", "OPTIONS")
	// Get frontend URL from environment variable, default to localhost:3000

	var frontendURL string
	var cypressURL string
	if os.Getenv("ENV_MODE") == "production" {
		frontendURL = os.Getenv("REACT_APP_PROD_FRONTEND_URL")
	} else {
		frontendURL = os.Getenv("REACT_APP_DEV_FRONTEND_URL")
		cypressURL = os.Getenv("REACT_APP_DEV_CYPRESS_URL")
	}

	// Setup CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"*"}, // Temporarily allow all origins for testing
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{
			"Content-Type",
			"Authorization",
			"Accept",
			"Origin",
			"X-Requested-With",
			"Access-Control-Allow-Origin",
			"Access-Control-Allow-Headers",
		},
		ExposedHeaders:   []string{"Content-Length"},
		AllowCredentials: true,
		Debug:            true,
		MaxAge:           300, // Maximum value not ignored by any of major browsers
	})

	// Create the base handler with CORS
	baseHandler := c.Handler(r)

	// Add logging and recovery middleware
	finalHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				log.Printf("Panic recovered: %v", err)
				http.Error(w, "Internal server error", http.StatusInternalServerError)
			}
		}()

		// Log incoming request
		log.Printf(
			"Incoming %s request to %s from %s",
			r.Method,
			r.URL.Path,
			r.RemoteAddr,
		)

		baseHandler.ServeHTTP(w, r)
	})

	// Get host from environment variable, default to localhost
	var host string
	if os.Getenv("ENV_MODE") == "production" {
		host = os.Getenv("SERVER_HOST")
	} else {
		host = "0.0.0.0" // fallback default
	}

	var port string
	if os.Getenv("ENV_MODE") == "production" {
		port = os.Getenv("SERVER_PORT")
	} else {
		port = "8080" // fallback default
	}

	address := fmt.Sprintf("%s:%s", host, port)

	// Start server with detailed logging
	log.Printf("Server starting on %s", address)
	log.Printf("CORS allowed origins: %v", []string{frontendURL, cypressURL})
	if err := http.ListenAndServe(address, finalHandler); err != nil {
		log.Fatal(err)
	}
}
