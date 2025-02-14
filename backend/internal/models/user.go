package models

import (
	"context"
	"fmt"
	"log"
	"time"

	"selo/internal/firebase"

	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/iterator"
)

// User represents the main user model, similar to Django's User model
type User struct {
	UID         string    `firestore:"uid" json:"uid"`
	Email       string    `firestore:"email" json:"email"`
	FirstName   string    `firestore:"first_name" json:"first_name"`
	LastName    string    `firestore:"last_name" json:"last_name"`
	IsActive    bool      `firestore:"is_active	 json:"is_active"`
	IsStaff     bool      `firestore:"is_staff" json:"is_staff"`
	IsSuperuser bool      `firestore:"is_superuser" json:"is_superuser"`
	Position    string    `firestore:"position" json:"position"`
	PhoneNumber string    `firestore:"phone_number" json:"phone_number"`
	Occupation  string    `firestore:"occupation" json:"occupation"`
	Paid        bool      `firestore:"paid" json:"paid"`
	LastLogin   time.Time `firestore:"last_login" json:"last_login"`
	DateJoined  time.Time `firestore:"date_joined" json:"date_joined"`
}

type UpdateUserInfo struct {
	Email       *string `json:"email,omitempty"`
	PhoneNumber *string `json:"phone_number,omitempty"`
	Occupation  *string `json:"occupation,omitempty"`
}

type UpdateUserInfoAdmin struct {
	Username    *string `json:"username,omitempty"`
	Email       *string `json:"email,omitempty"`
	PhoneNumber *string `json:"phone_number,omitempty"`
	Occupation  *string `json:"occupation,omitempty"`
	Position    *string `json:"position,omitempty"`
	IsActive    *bool   `json:"is_active,omitempty"`
	IsStaff     *bool   `json:"is_staff,omitempty"`
	IsSuperuser *bool   `json:"is_superuser,omitempty"`
	Password    *string `json:"password,omitempty"`
	FirstName   *string `json:"first_name,omitempty"`
	LastName    *string `json:"last_name,omitempty"`
}

type MemberResponse struct {
	UID         string `json:"uid"`
	FirstName   string `json:"first_name"`
	LastName    string `json:"last_name"`
	Email       string `json:"email"`
	Position    string `json:"position"`
	PhoneNumber string `json:"phone_number"`
	Occupation  string `json:"occupation"`
	Paid        bool   `json:"paid"`
}

type UpdatePassword struct {
	CurrentPassword string `json:"current_password"`
	NewPassword     string `json:"new_password"`
}

func GetUserByUID(uid string) (*User, error) {
	doc, err := firebase.FirestoreClient.Collection("users").Doc(uid).Get(context.Background())
	if err != nil {
		return nil, fmt.Errorf("error fetching user: %v", err)
	}

	var user User
	if err := doc.DataTo(&user); err != nil {
		return nil, fmt.Errorf("error parsing user data: %v", err)
	}

	return &user, nil
}

func CreateUserRecord(authUser *auth.UserRecord, userData *User) error {
	userData.UID = authUser.UID
	userData.DateJoined = time.Now()
	userData.IsActive = true

	_, err := firebase.FirestoreClient.Collection("users").Doc(authUser.UID).Set(context.Background(), userData)
	return err
}

func GetUserByEmail(email string) (*User, error) {
	iter := firebase.FirestoreClient.Collection("users").Where("email", "==", email).Documents(context.Background())
	doc, err := iter.Next()

	if err == iterator.Done {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}

	var user User
	err = doc.DataTo(&user)
	if err != nil {
		return nil, err
	}

	user.UID = doc.Ref.ID
	return &user, nil
}

// Add a helper function to create a user document
func CreateUserDocument(uid string, user *User) error {
	log.Printf("Creating user document for UID: %s", uid)

	_, err := firebase.FirestoreClient.Collection("users").Doc(uid).Set(context.Background(), map[string]interface{}{
		"email":       user.Email,
		"firstName":   user.FirstName,
		"lastName":    user.LastName,
		"isActive":    true,
		"isStaff":     false,
		"isSuperuser": false,
		"dateJoined":  time.Now(),
	})

	if err != nil {
		log.Printf("Error creating user document: %v", err)
		return fmt.Errorf("failed to create user document: %v", err)
	}

	log.Printf("Successfully created user document")
	return nil
}
