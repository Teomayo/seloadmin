package models

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"time"

	"selo/internal/firebase"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/auth"
	"google.golang.org/api/iterator"
)

type UserPreferences struct {
	Theme          string         `firestore:"theme" json:"theme"`
	WidgetSettings WidgetSettings `firestore:"widget_settings" json:"widget_settings"`
}

type WidgetSettings struct {
	Orthodox  bool `firestore:"orthodox" json:"orthodox"`
	Questions bool `firestore:"questions" json:"questions"`
	Members   bool `firestore:"members" json:"members"`
}

// User represents the main user model, similar to Django's User model
type User struct {
	UID         string          `firestore:"uid" json:"uid"`
	Username    string          `firestore:"username" json:"username"`
	Email       string          `firestore:"email" json:"email"`
	Password    string          `firestore:"password" json:"password,omitempty"`
	FirstName   string          `firestore:"first_name" json:"first_name"`
	LastName    string          `firestore:"last_name" json:"last_name"`
	Position    string          `firestore:"position" json:"position"`
	PhoneNumber string          `firestore:"phone_number" json:"phone_number"`
	Occupation  string          `firestore:"occupation" json:"occupation"`
	IsActive    bool            `firestore:"is_active" json:"is_active"`
	IsStaff     bool            `firestore:"is_staff" json:"is_staff"`
	IsSuperuser bool            `firestore:"is_superuser" json:"is_superuser"`
	Paid        bool            `firestore:"paid" json:"paid"`
	LastLogin   time.Time       `firestore:"last_login" json:"last_login"`
	DateJoined  time.Time       `firestore:"date_joined" json:"date_joined"`
	Preferences UserPreferences `firestore:"preferences" json:"preferences"`
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
	Paid        *bool   `json:"paid,omitempty"`
}

type MemberResponse struct {
	UID         string          `json:"uid"`
	FirstName   string          `json:"first_name"`
	LastName    string          `json:"last_name"`
	Email       string          `json:"email"`
	Position    string          `json:"position"`
	PhoneNumber string          `json:"phone_number"`
	Occupation  string          `json:"occupation"`
	Paid        bool            `json:"paid"`
	IsActive    bool            `json:"is_active"`
	IsStaff     bool            `json:"is_staff"`
	IsSuperuser bool            `json:"is_superuser"`
	Preferences UserPreferences `json:"preferences"`
}

type UpdatePassword struct {
	CurrentPassword string `json:"currentPassword"`
	NewPassword     string `json:"newPassword"`
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
	// Generate a random temporary password
	tempPassword := generateTempPassword() // We'll implement this helper function

	// Create the user in Firebase Auth with the temporary password
	params := (&auth.UserToCreate{}).
		Email(userData.Email).
		Password(tempPassword).
		DisplayName(fmt.Sprintf("%s %s", userData.FirstName, userData.LastName))

	auth, err := firebase.App.Auth(context.Background())
	if err != nil {
		return fmt.Errorf("error getting Firebase Auth client: %v", err)
	}
	authUser, err = auth.CreateUser(context.Background(), params)
	if err != nil {
		return fmt.Errorf("error creating Firebase Auth user: %v", err)
	}

	// Create the user record in Firestore
	userData.UID = authUser.UID
	userData.DateJoined = time.Now()
	userData.IsActive = true

	_, err = firebase.FirestoreClient.Collection("users").Doc(authUser.UID).Set(context.Background(), userData)
	if err != nil {
		// If Firestore creation fails, delete the Auth user to maintain consistency
		auth, err := firebase.App.Auth(context.Background())
		if err != nil {
			return fmt.Errorf("error getting Firebase Auth client: %v", err)
		}
		auth.DeleteUser(context.Background(), authUser.UID)
		return fmt.Errorf("error creating Firestore user: %v", err)
	}

	// Send password reset email
	_, err = auth.PasswordResetLink(context.Background(), userData.Email)
	if err != nil {
		return fmt.Errorf("error sending password reset email: %v", err)
	}

	// Optionally, you can customize the password reset email template in the Firebase Console
	// Firebase > Authentication > Templates > Password reset

	return nil
}

// Helper function to generate a secure temporary password
func generateTempPassword() string {
	const length = 16
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"

	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
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

func UpdateUser(uid string, updates *UpdateUserInfoAdmin) error {
	ctx := context.Background()

	// Update Firebase Auth user if needed
	params := (&auth.UserToUpdate{})
	if updates.Email != nil {
		params.Email(*updates.Email)
	}
	if updates.Password != nil {
		params.Password(*updates.Password)
	}

	auth, err := firebase.App.Auth(ctx)
	if err != nil {
		return fmt.Errorf("error getting Firebase Auth client: %v", err)
	}

	// Update Firebase Auth
	_, err = auth.UpdateUser(ctx, uid, params)
	if err != nil {
		return fmt.Errorf("error updating Firebase Auth user: %v", err)
	}

	// Update Firestore document
	updateData := make(map[string]interface{})
	if updates.FirstName != nil {
		updateData["first_name"] = *updates.FirstName
	}
	if updates.LastName != nil {
		updateData["last_name"] = *updates.LastName
	}
	if updates.Position != nil {
		updateData["position"] = *updates.Position
	}
	if updates.PhoneNumber != nil {
		updateData["phone_number"] = *updates.PhoneNumber
	}
	if updates.Occupation != nil {
		updateData["occupation"] = *updates.Occupation
	}
	if updates.IsActive != nil {
		updateData["is_active"] = *updates.IsActive
	}
	if updates.IsStaff != nil {
		updateData["is_staff"] = *updates.IsStaff
	}
	if updates.IsSuperuser != nil {
		updateData["is_superuser"] = *updates.IsSuperuser
	}

	_, err = firebase.FirestoreClient.Collection("users").Doc(uid).Set(ctx, updateData, firestore.MergeAll)
	if err != nil {
		return fmt.Errorf("error updating Firestore document: %v", err)
	}

	return nil
}

func DeleteUser(uid string) error {
	ctx := context.Background()

	// Delete from Firebase Auth
	auth, err := firebase.App.Auth(ctx)
	if err != nil {
		return fmt.Errorf("error getting Firebase Auth client: %v", err)
	}

	err = auth.DeleteUser(ctx, uid)
	if err != nil {
		return fmt.Errorf("error deleting Firebase Auth user: %v", err)
	}

	// Delete from Firestore
	_, err = firebase.FirestoreClient.Collection("users").Doc(uid).Delete(ctx)
	if err != nil {
		return fmt.Errorf("error deleting Firestore document: %v", err)
	}

	return nil
}

func UpdateUserPreferences(uid string, preferences *UserPreferences) error {
	ctx := context.Background()

	_, err := firebase.FirestoreClient.Collection("users").Doc(uid).Set(ctx, map[string]interface{}{
		"preferences": preferences,
	}, firestore.MergeAll)
	if err != nil {
		return fmt.Errorf("error updating user preferences: %v", err)
	}

	return nil
}
