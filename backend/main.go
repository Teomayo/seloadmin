package main

import (
	"fmt"
	"log"
	"net/http"
	"selo/config"
	"selo/internal/firebase"
	"selo/internal/handlers"
	"selo/internal/middleware"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	// Load config
	config, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize Firebase
	log.Println("Initializing Firebase...")
	if err := firebase.InitFirebase(); err != nil {
		log.Fatalf("Failed to initialize Firebase: %v", err)
	}
	defer firebase.CloseFirebase()
	log.Println("Firebase initialized successfully")

	// Initialize handlers with config
	handlers.Init(config)
	log.Println("Handlers initialized")

	// Initialize router
	r := mux.NewRouter()

	// Configure CORS with specific origin
	corsMiddleware := cors.New(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:3001",
			"http://host.docker.internal:3000",
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodPatch,
			http.MethodDelete,
			http.MethodOptions,
			http.MethodHead,
		},
		AllowedHeaders: []string{
			"Access-Control-Allow-Origin",
			"Content-Type",
			"Authorization",
			"X-Requested-With",
			"Accept",
			"Origin",
			"Access-Control-Request-Method",
			"Access-Control-Request-Headers",
		},
		ExposedHeaders:   []string{"Content-Length", "Content-Type", "Authorization"},
		AllowCredentials: true,
		MaxAge:           300,
		Debug:            true,
	})

	// Public routes (no auth required)
	api := r.PathPrefix("/api").Subrouter()
	api.HandleFunc("/login", handlers.Login).Methods("POST")
	api.HandleFunc("/signup", handlers.SignUp).Methods("POST")

	// Protected routes (auth required)
	// Apply auth middleware to all routes in this subrouter
	protected := api.PathPrefix("").Subrouter()
	protected.Use(middleware.AuthMiddleware)

	// Add protected routes
	protected.HandleFunc("/profile", handlers.GetProfile).Methods("GET")
	protected.HandleFunc("/members/count", handlers.GetMembersCount).Methods("GET")
	protected.HandleFunc("/members", handlers.GetMembersInfo).Methods("GET")
	protected.HandleFunc("/members/{username}", handlers.GetMemberInfo).Methods("GET")
	protected.HandleFunc("/members/{username}", handlers.UpdateMemberInfo).Methods("PUT")
	protected.HandleFunc("/update-user/{username}", handlers.UpdateUser).Methods("PUT")
	protected.HandleFunc("/delete-user/{username}", handlers.DeleteUser).Methods("DELETE")
	protected.HandleFunc("/questions", handlers.GetQuestions).Methods("GET")
	protected.HandleFunc("/questions/{id}/choices", handlers.GetChoices).Methods("GET")
	protected.HandleFunc("/choices/{id}/vote", handlers.VoteForChoice).Methods("POST")

	// Use CORS middleware
	handler := corsMiddleware.Handler(r)

	// Start server
	port := config.ServerPort
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := http.ListenAndServe(fmt.Sprintf("0.0.0.0:%s", port), handler); err != nil {
		log.Fatal(err)
	}
}
