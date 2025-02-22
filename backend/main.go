package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
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
			"https://selo-admin.web.app",
			"https://selo-admin.firebaseapp.com",
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
	protected.HandleFunc("/members/{uid}", handlers.GetMemberInfo).Methods("GET")
	protected.HandleFunc("/members/{uid}/update", handlers.UpdateMemberInfo).Methods("PUT")
	protected.HandleFunc("/members/{uid}/password", handlers.UpdateMemberPassword).Methods("PUT")
	protected.HandleFunc("/contacts", handlers.GetContacts).Methods("GET")
	protected.HandleFunc("/contacts", handlers.CreateContact).Methods("POST")
	protected.HandleFunc("/contacts/{id}", handlers.GetContactByID).Methods("GET")
	protected.HandleFunc("/contacts/{id}", handlers.UpdateContact).Methods("PUT")
	protected.HandleFunc("/contacts/{id}", handlers.DeleteContact).Methods("DELETE")
	protected.HandleFunc("/users", handlers.GetUsers).Methods("GET")
	protected.HandleFunc("/users/{uid}", handlers.GetUserByUID).Methods("GET")
	protected.HandleFunc("/users/{uid}", handlers.UpdateUser).Methods("PUT")
	protected.HandleFunc("/users/{uid}/email", handlers.UpdateUserEmail).Methods("PUT")
	protected.HandleFunc("/users/{uid}/password", handlers.UpdateUserPassword).Methods("PUT")
	protected.HandleFunc("/users/{uid}/preferences", handlers.UpdateUserPreferences).Methods("PUT")
	protected.HandleFunc("/create-user", handlers.CreateUser).Methods("POST")
	protected.HandleFunc("/delete-user/{uid}", handlers.DeleteUser).Methods("DELETE")
	protected.HandleFunc("/questions", handlers.GetQuestions).Methods("GET")
	protected.HandleFunc("/questions", handlers.CreateQuestion).Methods("POST")
	protected.HandleFunc("/questions/{id}", handlers.UpdateQuestion).Methods("PUT")
	protected.HandleFunc("/questions/{id}/archive", handlers.ArchiveQuestion).Methods("PUT")
	protected.HandleFunc("/questions/{id}/choices", handlers.GetChoices).Methods("GET")
	protected.HandleFunc("/choices/{id}/vote", handlers.VoteForChoice).Methods("POST")

	// Use CORS middleware
	handler := corsMiddleware.Handler(r)

	// Start server
	// Get host from environment variable, default to localhost
	host := os.Getenv("SERVER_HOST")
	if host == "" {
		host = "0.0.0.0" // fallback default
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
