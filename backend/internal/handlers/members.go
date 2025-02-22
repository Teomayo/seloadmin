package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"selo/internal/firebase"
	"selo/internal/models"
	"strings"
	"time"

	"net/smtp"

	"cloud.google.com/go/firestore"
	"firebase.google.com/go/v4/auth"
	"github.com/gorilla/mux"
	"google.golang.org/api/iterator"
)

func GetMembersCount(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// Get reference to users collection
	usersRef := firebase.FirestoreClient.Collection("users")
	documents, err := usersRef.Documents(ctx).GetAll()
	if err != nil {
		log.Printf("Error retrieving users: %v", err)
		http.Error(w, "Error retrieving members count", http.StatusInternalServerError)
		return
	}
	count := len(documents)
	json.NewEncoder(w).Encode(map[string]int{"count": count})
}

func GetMembersInfo(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// Get reference to users collection and create iterator
	iter := firebase.FirestoreClient.Collection("users").Documents(ctx)
	defer iter.Stop()

	var response []models.MemberResponse
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Error iterating users: %v", err)
			http.Error(w, "Error retrieving members", http.StatusInternalServerError)
			return
		}

		var member models.User
		if err := doc.DataTo(&member); err != nil {
			log.Printf("Error parsing user data: %v", err)
			continue
		}

		response = append(response, models.MemberResponse{
			UID:         member.UID,
			FirstName:   member.FirstName,
			LastName:    member.LastName,
			Email:       member.Email,
			Position:    member.Position,
			PhoneNumber: member.PhoneNumber,
			Occupation:  member.Occupation,
			Paid:        member.Paid,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetMemberInfo(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	uid := mux.Vars(r)["uid"]

	// Get reference to users collection and create iterator
	iter := firebase.FirestoreClient.Collection("users").Where("uid", "==", uid).Documents(ctx)
	defer iter.Stop()

	var response []models.MemberResponse
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Error iterating users: %v", err)
			http.Error(w, "Error retrieving members", http.StatusInternalServerError)
			return
		}

		var member models.User
		if err := doc.DataTo(&member); err != nil {
			log.Printf("Error parsing user data: %v", err)
			continue
		}

		response = append(response, models.MemberResponse{
			UID:         member.UID,
			FirstName:   member.FirstName,
			LastName:    member.LastName,
			Email:       member.Email,
			Position:    member.Position,
			PhoneNumber: member.PhoneNumber,
			Occupation:  member.Occupation,
			Paid:        member.Paid,
			IsActive:    member.IsActive,
			IsStaff:     member.IsStaff,
			IsSuperuser: member.IsSuperuser,
			Preferences: member.Preferences,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func UpdateMemberInfo(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	uid := mux.Vars(r)["uid"]

	// Get and verify the Firebase token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		log.Printf("No authorization header")
		http.Error(w, "No authorization header", http.StatusUnauthorized)
		return
	}

	// Remove "Bearer " prefix
	idToken := strings.TrimPrefix(authHeader, "Bearer ")
	token, err := firebase.Auth.VerifyIDToken(ctx, idToken)
	if err != nil {
		log.Printf("Error verifying token: %v", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Get user claims to check if admin or if user is updating their own info
	claims := token.Claims
	tokenUID := claims["user_id"].(string)
	isAdmin, _ := claims["admin"].(bool)

	// Only allow if user is admin or updating their own info
	if !isAdmin && tokenUID != uid {
		log.Printf("Unauthorized access attempt: user %s trying to update %s", tokenUID, uid)
		http.Error(w, "Unauthorized access", http.StatusForbidden)
		return
	}

	var updatedInfo models.UpdateUserInfo
	if err := json.NewDecoder(r.Body).Decode(&updatedInfo); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Get document reference directly
	docRef := firebase.FirestoreClient.Collection("users").Doc(uid)

	// Prepare updates
	updates := make(map[string]interface{})
	if updatedInfo.Email != nil {
		updates["email"] = *updatedInfo.Email
	}
	if updatedInfo.PhoneNumber != nil {
		updates["phone_number"] = *updatedInfo.PhoneNumber
	}
	if updatedInfo.Occupation != nil {
		updates["occupation"] = *updatedInfo.Occupation
	}

	// Update the document
	_, err = docRef.Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		log.Printf("Error updating user: %v", err)
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func UpdateMemberPassword(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	uid := mux.Vars(r)["uid"]

	// Get and verify the Firebase token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		log.Printf("No authorization header")
		http.Error(w, "No authorization header", http.StatusUnauthorized)
		return
	}

	// Remove "Bearer " prefix
	idToken := strings.TrimPrefix(authHeader, "Bearer ")
	token, err := firebase.Auth.VerifyIDToken(ctx, idToken)
	if err != nil {
		log.Printf("Error verifying token: %v", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Get user claims to check if admin or if user is updating their own info
	claims := token.Claims
	tokenUID := token.UID
	isAdmin, _ := claims["admin"].(bool)

	// Only allow if user is admin or updating their own info
	if !isAdmin && tokenUID != uid {
		log.Printf("Unauthorized access attempt: user %s trying to update password for %s", tokenUID, uid)
		http.Error(w, "Unauthorized access", http.StatusForbidden)
		return
	}

	var passwordData models.UpdatePassword
	if err := json.NewDecoder(r.Body).Decode(&passwordData); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if passwordData.NewPassword == "" {
		http.Error(w, "New password cannot be empty", http.StatusBadRequest)
		return
	}

	// Update password directly in Firebase Auth using UID
	params := (&auth.UserToUpdate{}).
		Password(passwordData.NewPassword)

	_, err = firebase.Auth.UpdateUser(ctx, uid, params)
	if err != nil {
		log.Printf("Error updating password in Auth: %v", err)
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func GetUserByUID(w http.ResponseWriter, r *http.Request) {
	log.Printf("GetUsers handler called")

	uid := mux.Vars(r)["uid"]

	user, err := models.GetUserByUID(uid)
	if err != nil {
		log.Printf("Error fetching user: %v", err)
		http.Error(w, "Error fetching user", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(user)
}

func GetUsers(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	log.Printf("GetUsers handler called")

	// Get and verify the Firebase token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		log.Printf("No authorization header")
		http.Error(w, "No authorization header", http.StatusUnauthorized)
		return
	}

	// Remove "Bearer " prefix
	idToken := strings.TrimPrefix(authHeader, "Bearer ")
	auth, err := firebase.App.Auth(ctx)
	if err != nil {
		log.Printf("Error getting Firebase Auth client: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	// Verify the token using Firebase Auth
	token, err := auth.VerifyIDToken(ctx, idToken)
	if err != nil {
		log.Printf("Error verifying token: %v", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Get user claims to check if admin
	claims := token.Claims
	isAdmin, ok := claims["admin"].(bool)
	if !ok || !isAdmin {
		// Check if superuser in Firestore
		email := claims["email"].(string)
		userDoc, err := getUserByEmail(ctx, email)
		if err != nil || !userDoc.IsSuperuser {
			log.Printf("User not authorized: %v", err)
			http.Error(w, "Unauthorized access", http.StatusUnauthorized)
			return
		}
	}

	// Get all users from Firestore
	iter := firebase.FirestoreClient.Collection("users").Documents(ctx)
	defer iter.Stop()

	var users []models.User
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Error iterating users: %v", err)
			http.Error(w, "Error retrieving users", http.StatusInternalServerError)
			return
		}

		var user models.User
		if err := doc.DataTo(&user); err != nil {
			log.Printf("Error parsing user data: %v", err)
			continue
		}
		users = append(users, user)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		log.Printf("Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

// Helper function to get user by email
func getUserByEmail(ctx context.Context, email string) (*models.User, error) {
	iter := firebase.FirestoreClient.Collection("users").Where("email", "==", email).Documents(ctx)
	defer iter.Stop()

	doc, err := iter.Next()
	if err == iterator.Done {
		return nil, fmt.Errorf("user not found")
	}
	if err != nil {
		return nil, err
	}

	var user models.User
	if err := doc.DataTo(&user); err != nil {
		return nil, err
	}

	return &user, nil
}

// Add this helper function for sending emails
func sendEmail(from, to, subject, body string) error {
	// Get email configuration from environment variables
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")
	smtpUsername := os.Getenv("SMTP_USERNAME")
	smtpPassword := os.Getenv("SMTP_PASSWORD")

	// Generate Message-ID
	messageID := fmt.Sprintf("<%d.%s@%s>", time.Now().UnixNano(), to, smtpHost)

	// Get current time for Date header
	date := time.Now().Format("Mon, 02 Jan 2006 15:04:05 -0700")

	// Compose email with proper headers
	headers := map[string]string{
		"From":         fmt.Sprintf("SELO Admin <%s>", from),
		"To":           to,
		"Subject":      subject,
		"MIME-Version": "1.0",
		"Content-Type": "text/plain; charset=UTF-8",
		"Message-ID":   messageID,
		"Date":         date,
		"X-Mailer":     "SELO Admin System",
	}

	// Build message with headers
	var message strings.Builder
	for key, value := range headers {
		message.WriteString(fmt.Sprintf("%s: %s\r\n", key, value))
	}
	message.WriteString("\r\n")
	message.WriteString(body)

	// Authentication
	auth := smtp.PlainAuth("", smtpUsername, smtpPassword, smtpHost)

	// Send email
	err := smtp.SendMail(
		smtpHost+":"+smtpPort,
		auth,
		from,
		[]string{to},
		[]byte(message.String()),
	)
	if err != nil {
		return fmt.Errorf("error sending email: %v", err)
	}

	return nil
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	var newUser models.User
	if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Generate a secure temporary password
	tempPassword := generateTempPassword(16)

	// Create user in Firebase Auth
	params := (&auth.UserToCreate{}).
		Email(newUser.Email).
		Password(tempPassword).
		DisplayName(newUser.FirstName + " " + newUser.LastName)

	authUser, err := firebase.Auth.CreateUser(ctx, params)
	if err != nil {
		log.Printf("Error creating user in Auth: %v", err)
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Add UID to user data
	newUser.UID = authUser.UID

	// Create user document in Firestore
	_, err = firebase.FirestoreClient.Collection("users").Doc(authUser.UID).Set(ctx, newUser)
	if err != nil {
		log.Printf("Error creating user in Firestore: %v", err)
		// Clean up: delete the auth user if Firestore creation fails
		firebase.Auth.DeleteUser(ctx, authUser.UID)
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	// Generate verification link
	actionCodeSettings := &auth.ActionCodeSettings{
		URL:             os.Getenv("FRONTEND_URL") + "/login", // Frontend URL for email verification
		HandleCodeInApp: true,
	}

	_, err = firebase.Auth.EmailVerificationLinkWithSettings(ctx, newUser.Email, actionCodeSettings)
	if err != nil {
		log.Printf("Error generating verification link: %v", err)
		// Continue execution as user is created successfully
	}

	// Prepare email content with HTML-safe links
	emailSubject := "Welcome to SELO - Account Creation"
	verificationURL := os.Getenv("FRONTEND_URL") + "/verify-email"

	emailBody := fmt.Sprintf(`
Welcome to SELO!

Your account has been created successfully. Here are your temporary credentials:

Email: %s
Temporary Password: %s

To verify your email, please visit:
%s

After verifying your email, please log in at https://selo-admin.web.app and change your password immediately.

Important Security Notice:
- This is an automated message, please do not reply
- Keep your credentials secure
- Change your password upon first login
- Never share your password with others

If you did not request this account, please contact support immediately.

Best regards,
SELO Team

This email was sent by SELO Admin System
`, newUser.Email, tempPassword, verificationURL)

	// Send welcome email
	err = sendEmail(
		os.Getenv("SMTP_FROM_EMAIL"),
		newUser.Email,
		emailSubject,
		emailBody,
	)
	if err != nil {
		log.Printf("Error sending welcome email: %v", err)
		// Don't return error as user is created successfully
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "User created successfully. Check email for verification link.",
		"uid":     authUser.UID,
	})
}

// Helper function to generate a secure temporary password
func generateTempPassword(length int) string {
	const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
	b := make([]byte, length)
	for i := range b {
		b[i] = charset[rand.Intn(len(charset))]
	}
	return string(b)
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	uid := mux.Vars(r)["uid"]

	// Delete from Firebase Auth first
	if err := firebase.Auth.DeleteUser(ctx, uid); err != nil {
		log.Printf("Error deleting user from Auth: %v", err)
		http.Error(w, "Error deleting user from Auth", http.StatusInternalServerError)
		return
	}

	// Delete from Firestore
	_, err := firebase.FirestoreClient.Collection("users").Doc(uid).Delete(ctx)
	if err != nil {
		log.Printf("Error deleting user from Firestore: %v", err)
		http.Error(w, "Error deleting user from Firestore", http.StatusInternalServerError)
		return
	}

	// Return 204 No Content for successful deletion
	w.WriteHeader(http.StatusNoContent)
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	uid := mux.Vars(r)["uid"]

	var userData models.UpdateUserInfoAdmin
	if err := json.NewDecoder(r.Body).Decode(&userData); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Update user in Firebase Auth
	params := &auth.UserToUpdate{}
	if userData.Email != nil {
		params.Email(*userData.Email)
	}
	if userData.FirstName != nil || userData.LastName != nil {
		firstName := ""
		lastName := ""
		if userData.FirstName != nil {
			firstName = *userData.FirstName
		}
		if userData.LastName != nil {
			lastName = *userData.LastName
		}
		params.DisplayName(firstName + " " + lastName)
	}

	_, err := firebase.Auth.UpdateUser(ctx, uid, params)
	if err != nil {
		log.Printf("Error updating user in Auth: %v", err)
		http.Error(w, "Failed to update user in Auth", http.StatusInternalServerError)
		return
	}

	// Update user in Firestore
	docRef := firebase.FirestoreClient.Collection("users").Doc(uid)
	updates := []firestore.Update{}

	if userData.Email != nil {
		updates = append(updates, firestore.Update{Path: "email", Value: *userData.Email})
	}
	if userData.FirstName != nil {
		updates = append(updates, firestore.Update{Path: "first_name", Value: *userData.FirstName})
	}
	if userData.LastName != nil {
		updates = append(updates, firestore.Update{Path: "last_name", Value: *userData.LastName})
	}
	if userData.Position != nil {
		updates = append(updates, firestore.Update{Path: "position", Value: *userData.Position})
	}
	if userData.PhoneNumber != nil {
		updates = append(updates, firestore.Update{Path: "phone_number", Value: *userData.PhoneNumber})
	}
	if userData.Occupation != nil {
		updates = append(updates, firestore.Update{Path: "occupation", Value: *userData.Occupation})
	}
	if userData.IsActive != nil {
		updates = append(updates, firestore.Update{Path: "is_active", Value: *userData.IsActive})
	}
	if userData.IsStaff != nil {
		updates = append(updates, firestore.Update{Path: "is_staff", Value: *userData.IsStaff})
	}
	if userData.IsSuperuser != nil {
		updates = append(updates, firestore.Update{Path: "is_superuser", Value: *userData.IsSuperuser})
	}
	if userData.Paid != nil {
		updates = append(updates, firestore.Update{Path: "paid", Value: *userData.Paid})
	}
	if len(updates) > 0 {
		_, err = docRef.Update(ctx, updates)
		if err != nil {
			log.Printf("Error updating user in Firestore: %v", err)
			http.Error(w, "Failed to update user in database", http.StatusInternalServerError)
			return
		}
	}

	w.WriteHeader(http.StatusNoContent)
}

func UpdateUserPassword(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	uid := mux.Vars(r)["uid"]

	// Get and verify the Firebase token
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		log.Printf("No authorization header")
		http.Error(w, "No authorization header", http.StatusUnauthorized)
		return
	}

	// Remove "Bearer " prefix
	idToken := strings.TrimPrefix(authHeader, "Bearer ")
	token, err := firebase.Auth.VerifyIDToken(ctx, idToken)
	if err != nil {
		log.Printf("Error verifying token: %v", err)
		http.Error(w, "Invalid token", http.StatusUnauthorized)
		return
	}

	// Get user claims to check if admin or if user is updating their own info
	claims := token.Claims
	tokenUID := token.UID
	isAdmin, _ := claims["admin"].(bool)

	// Only allow if user is admin or updating their own info
	if !isAdmin && tokenUID != uid {
		log.Printf("Unauthorized access attempt: user %s trying to update password for %s", tokenUID, uid)
		http.Error(w, "Unauthorized access", http.StatusForbidden)
		return
	}

	var passwordData models.UpdatePassword
	if err := json.NewDecoder(r.Body).Decode(&passwordData); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if passwordData.NewPassword == "" {
		http.Error(w, "New password cannot be empty", http.StatusBadRequest)
		return
	}

	// Update password in Firebase Auth
	params := (&auth.UserToUpdate{}).
		Password(passwordData.NewPassword)

	_, err = firebase.Auth.UpdateUser(ctx, uid, params)
	if err != nil {
		log.Printf("Error updating password: %v", err)
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func UpdateUserEmail(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	uid := mux.Vars(r)["uid"]

	var emailData struct {
		NewEmail string `json:"newEmail"`
	}
	if err := json.NewDecoder(r.Body).Decode(&emailData); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	if emailData.NewEmail == "" {
		http.Error(w, "New email is required", http.StatusBadRequest)
		return
	}

	// Update email in Firebase Auth
	params := (&auth.UserToUpdate{}).
		Email(emailData.NewEmail)

	_, err := firebase.Auth.UpdateUser(ctx, uid, params)
	if err != nil {
		log.Printf("Error updating email in Auth: %v", err)
		http.Error(w, "Failed to update email in Auth", http.StatusInternalServerError)
		return
	}

	// Update email in Firestore
	docRef := firebase.FirestoreClient.Collection("users").Doc(uid)
	_, err = docRef.Update(ctx, []firestore.Update{
		{Path: "email", Value: emailData.NewEmail},
	})
	if err != nil {
		log.Printf("Error updating email in Firestore: %v", err)
		http.Error(w, "Failed to update email in Firestore", http.StatusInternalServerError)
		return
	}

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Email updated successfully",
	})
}

func UpdateUserPreferences(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	uid := vars["uid"]

	var preferences models.UserPreferences
	if err := json.NewDecoder(r.Body).Decode(&preferences); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if err := models.UpdateUserPreferences(uid, &preferences); err != nil {
		log.Printf("Error updating user preferences: %v", err)
		http.Error(w, "Failed to update user preferences", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
