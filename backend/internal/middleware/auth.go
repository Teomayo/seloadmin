package middleware

import (
	"context"
	"log"
	"net/http"
	"selo/internal/firebase"
	"strings"
)

// UserContextKey is the key used to store the Firebase token in the request context
type contextKey string

const UserContextKey contextKey = "user"

// AuthMiddleware now implements mux.MiddlewareFunc
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Handle preflight requests
		if r.Method == "OPTIONS" {
			next.ServeHTTP(w, r)
			return
		}

		// Get the Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			log.Printf("No Authorization header")
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Check if the header starts with "Bearer "
		idToken := strings.TrimPrefix(authHeader, "Bearer ")
		if idToken == authHeader {
			log.Printf("Authorization header doesn't start with Bearer")
			http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

		// Verify the Firebase token
		token, err := firebase.Auth.VerifyIDToken(context.Background(), idToken)
		if err != nil {
			log.Printf("Error verifying token: %v", err)
			http.Error(w, "Invalid token", http.StatusUnauthorized)
			return
		}

		// Add the verified token claims to the request context
		ctx := context.WithValue(r.Context(), "user", token)
		r = r.WithContext(ctx)

		log.Printf("Successfully authenticated user: %s", token.UID)
		next.ServeHTTP(w, r)
	})
}
