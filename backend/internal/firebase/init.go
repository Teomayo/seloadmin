package firebase

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"cloud.google.com/go/firestore"
	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/option"
)

var (
	App             *firebase.App
	Auth            *auth.Client
	FirestoreClient *firestore.Client
	ctx             = context.Background()
)

func verifyFirestoreConnection() error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	log.Println("Verifying Firestore connection...")

	// Try to list collections as a connection test
	collections, err := FirestoreClient.Collections(ctx).GetAll()
	if err != nil {
		return fmt.Errorf("failed to list collections: %v", err)
	}

	log.Printf("Successfully connected to Firestore. Found %d collections", len(collections))
	return nil
}

func InitFirebase() error {
	var app *firebase.App
	var err error
	timeout := 60 * time.Second // default timeout
	if os.Getenv("ENV_MODE") == "development" {
		// Development mode - use emulators
		authEmulatorHost := "127.0.0.1:9099"
		firestoreEmulatorHost := "127.0.0.1:8000"

		os.Setenv("FIREBASE_AUTH_EMULATOR_HOST", authEmulatorHost)
		os.Setenv("FIRESTORE_EMULATOR_HOST", firestoreEmulatorHost)

		log.Printf("Using Firebase emulators:")
		log.Printf("Auth Emulator: %s", authEmulatorHost)
		log.Printf("Firestore Emulator: %s", firestoreEmulatorHost)

		config := &firebase.Config{
			ProjectID: "selo-b7d60",
		}

		app, err = firebase.NewApp(context.Background(), config)
	} else {
		// Production mode
		log.Println("Initializing Firebase in production mode...")

		// Clear any emulator environment variables
		os.Unsetenv("FIREBASE_AUTH_EMULATOR_HOST")
		os.Unsetenv("FIRESTORE_EMULATOR_HOST")

		// Get timeout from environment or use default
		timeoutStr := os.Getenv("FIRESTORE_TIMEOUT")
		if t, err := time.ParseDuration(timeoutStr + "s"); err == nil {
			timeout = t
		}

		opt := option.WithCredentialsFile(os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"))
		app, err = firebase.NewApp(context.Background(), nil, opt)
	}

	if err != nil {
		return fmt.Errorf("error initializing app: %v", err)
	}

	// Initialize Auth with timeout
	authCtx, authCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer authCancel()

	log.Println("Initializing Firebase Auth...")
	Auth, err = app.Auth(authCtx)
	if err != nil {
		return fmt.Errorf("error initializing auth: %v", err)
	}
	log.Println("Firebase Auth initialized successfully")

	// Initialize Firestore with timeout
	fsCtx, fsCancel := context.WithTimeout(context.Background(), timeout)
	defer fsCancel()

	log.Println("Initializing Firestore...")
	FirestoreClient, err = app.Firestore(fsCtx)
	if err != nil {
		return fmt.Errorf("error initializing firestore: %v", err)
	}
	log.Println("Firestore initialized successfully")

	// Test connection with configurable timeout
	testCtx, testCancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer testCancel()

	log.Println("Testing Firestore connection...")
	_, err = FirestoreClient.Collection("users").Documents(testCtx).GetAll()
	if err != nil {
		return fmt.Errorf("failed to verify firestore connection: %v", err)
	}

	App = app
	log.Println("Firebase initialization completed successfully")
	return nil
}

func CloseFirebase() {
	if FirestoreClient != nil {
		FirestoreClient.Close()
	}
}
