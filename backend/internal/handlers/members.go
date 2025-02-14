package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"selo/internal/firebase"
	"selo/internal/models"

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
	username := mux.Vars(r)["username"]

	// Query user by email (assuming username is email)
	iter := firebase.FirestoreClient.Collection("users").Where("email", "==", username).Documents(ctx)
	defer iter.Stop()

	doc, err := iter.Next()
	if err == iterator.Done {
		http.Error(w, "Member not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("Error querying user: %v", err)
		http.Error(w, "Error retrieving member", http.StatusInternalServerError)
		return
	}

	var member models.User
	if err := doc.DataTo(&member); err != nil {
		log.Printf("Error parsing user data: %v", err)
		http.Error(w, "Error parsing member data", http.StatusInternalServerError)
		return
	}

	response := models.MemberResponse{
		UID:         member.UID,
		FirstName:   member.FirstName,
		LastName:    member.LastName,
		Email:       member.Email,
		Position:    member.Position,
		PhoneNumber: member.PhoneNumber,
		Occupation:  member.Occupation,
		Paid:        member.Paid,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func UpdateMemberInfo(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	username := mux.Vars(r)["username"]

	var updatedInfo models.UpdateUserInfo
	if err := json.NewDecoder(r.Body).Decode(&updatedInfo); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Query user by email
	iter := firebase.FirestoreClient.Collection("users").Where("email", "==", username).Documents(ctx)
	defer iter.Stop()

	doc, err := iter.Next()
	if err == iterator.Done {
		http.Error(w, "Member not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("Error querying user: %v", err)
		http.Error(w, "Error retrieving member", http.StatusInternalServerError)
		return
	}

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
	_, err = doc.Ref.Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		log.Printf("Error updating user: %v", err)
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func UpdateMemberPassword(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	username := mux.Vars(r)["username"]

	var passwordData models.UpdatePassword
	if err := json.NewDecoder(r.Body).Decode(&passwordData); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Query user by email
	iter := firebase.FirestoreClient.Collection("users").Where("email", "==", username).Documents(ctx)
	defer iter.Stop()

	_, err := iter.Next()
	if err == iterator.Done {
		http.Error(w, "Member not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("Error querying user: %v", err)
		http.Error(w, "Error retrieving member", http.StatusInternalServerError)
		return
	}

	// Update password in Firebase Auth
	userRecord, err := firebase.Auth.GetUserByEmail(ctx, username)
	if err != nil {
		log.Printf("Error getting user from Auth: %v", err)
		http.Error(w, "Error updating password", http.StatusInternalServerError)
		return
	}
	if passwordData.NewPassword == "" {
		http.Error(w, "New password cannot be empty", http.StatusBadRequest)
		return
	}
	params := (&auth.UserToUpdate{}).
		Password(passwordData.NewPassword)
	_, err = firebase.Auth.UpdateUser(ctx, userRecord.UID, params)
	if err != nil {
		log.Printf("Error updating password: %v", err)
		http.Error(w, "Failed to update password", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func GetUsers(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

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

	json.NewEncoder(w).Encode(users)
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	var newUser models.User
	if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Create user in Firebase Auth
	params := (&auth.UserToCreate{}).
		Email(newUser.Email).
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
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	username := mux.Vars(r)["username"]

	// Query user by email
	iter := firebase.FirestoreClient.Collection("users").Where("email", "==", username).Documents(ctx)
	defer iter.Stop()

	doc, err := iter.Next()
	if err == iterator.Done {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("Error querying user: %v", err)
		http.Error(w, "Error retrieving user", http.StatusInternalServerError)
		return
	}

	// Delete from Firebase Auth
	var user models.User
	if err := doc.DataTo(&user); err != nil {
		log.Printf("Error parsing user data: %v", err)
		http.Error(w, "Error parsing user data", http.StatusInternalServerError)
		return
	}

	if err := firebase.Auth.DeleteUser(ctx, user.UID); err != nil {
		log.Printf("Error deleting user from Auth: %v", err)
		http.Error(w, "Error deleting user", http.StatusInternalServerError)
		return
	}

	// Delete from Firestore
	_, err = doc.Ref.Delete(ctx)
	if err != nil {
		log.Printf("Error deleting user from Firestore: %v", err)
		http.Error(w, "Error deleting user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	username := mux.Vars(r)["username"]

	var updatedInfo models.UpdateUserInfoAdmin
	if err := json.NewDecoder(r.Body).Decode(&updatedInfo); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Query user by email
	iter := firebase.FirestoreClient.Collection("users").Where("email", "==", username).Documents(ctx)
	defer iter.Stop()

	doc, err := iter.Next()
	if err == iterator.Done {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	if err != nil {
		log.Printf("Error querying user: %v", err)
		http.Error(w, "Error retrieving user", http.StatusInternalServerError)
		return
	}

	// Prepare updates for Firestore
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
	if updatedInfo.Position != nil {
		updates["position"] = *updatedInfo.Position
	}
	if updatedInfo.IsActive != nil {
		updates["is_active"] = *updatedInfo.IsActive
	}
	if updatedInfo.IsStaff != nil {
		updates["is_staff"] = *updatedInfo.IsStaff
	}
	if updatedInfo.IsSuperuser != nil {
		updates["is_superuser"] = *updatedInfo.IsSuperuser
	}
	if updatedInfo.FirstName != nil {
		updates["first_name"] = *updatedInfo.FirstName
	}
	if updatedInfo.LastName != nil {
		updates["last_name"] = *updatedInfo.LastName
	}

	// Update in Firestore
	_, err = doc.Ref.Set(ctx, updates, firestore.MergeAll)
	if err != nil {
		log.Printf("Error updating user in Firestore: %v", err)
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	// Update in Firebase Auth if necessary
	var user models.User
	if err := doc.DataTo(&user); err != nil {
		log.Printf("Error parsing user data: %v", err)
		http.Error(w, "Error parsing user data", http.StatusInternalServerError)
		return
	}

	authUpdates := auth.UserToUpdate{}
	if updatedInfo.Email != nil {
		authUpdates.Email(*updatedInfo.Email)
	}
	if updatedInfo.Password != nil {
		authUpdates.Password(*updatedInfo.Password)
	}
	if updatedInfo.FirstName != nil || updatedInfo.LastName != nil {
		firstName := user.FirstName
		lastName := user.LastName
		if updatedInfo.FirstName != nil {
			firstName = *updatedInfo.FirstName
		}
		if updatedInfo.LastName != nil {
			lastName = *updatedInfo.LastName
		}
		authUpdates.DisplayName(firstName + " " + lastName)
	}

	_, err = firebase.Auth.UpdateUser(ctx, user.UID, &authUpdates)
	if err != nil {
		log.Printf("Error updating user in Auth: %v", err)
		http.Error(w, "Failed to update user authentication", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
