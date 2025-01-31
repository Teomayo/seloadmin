package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"selo/internal/database"
	"selo/internal/models"

	"github.com/gorilla/mux"
)

func GetMembersCount(w http.ResponseWriter, r *http.Request) {
	var count int64
	result := database.DB.Model(&models.User{}).Count(&count)
	if result.Error != nil {
		http.Error(w, "Error counting members", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]int64{"count": count})
}

func GetMembersInfo(w http.ResponseWriter, r *http.Request) {
	var members []models.User
	result := database.DB.Find(&members)

	if result.Error != nil {
		http.Error(w, "Error retrieving members", http.StatusInternalServerError)
		return
	}

	var response []models.MemberResponse
	for _, member := range members {
		response = append(response, models.MemberResponse{
			ID:          member.ID,
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
	username := mux.Vars(r)["username"]
	var member models.User
	result := database.DB.Find(&member, "username = ?", username)
	if result.Error != nil {
		http.Error(w, "Error retrieving member", http.StatusInternalServerError)
		return
	}
	response := models.MemberResponse{
		ID:          member.ID,
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
	username := mux.Vars(r)["username"]

	var updatedInfo models.UpdateUserInfo // Use the new struct for partial updates
	if err := json.NewDecoder(r.Body).Decode(&updatedInfo); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Prepare the update query
	db := database.DB            // Use the existing database connection
	userUpdates := models.User{} // Create an empty User struct to hold updates

	// Check which fields are set and update accordingly
	if updatedInfo.Email != nil {
		userUpdates.Email = *updatedInfo.Email
	}
	if updatedInfo.PhoneNumber != nil {
		userUpdates.PhoneNumber = *updatedInfo.PhoneNumber
	}
	if updatedInfo.Occupation != nil {
		userUpdates.Occupation = *updatedInfo.Occupation
	}

	// Perform the update
	if err := db.Model(&models.User{}).Where("username = ?", username).Updates(userUpdates).Error; err != nil {
		http.Error(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent) // 204 No Content
}

func UpdateMemberPassword(w http.ResponseWriter, r *http.Request) {
	username := mux.Vars(r)["username"]
	var passwordData models.UpdatePassword
	if err := json.NewDecoder(r.Body).Decode(&passwordData); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	database.DB.Model(&models.User{}).Where("username = ?", username).Updates(passwordData)
	w.WriteHeader(http.StatusNoContent) // 204 No Content
}

func GetUsers(w http.ResponseWriter, r *http.Request) {
	var users []models.User
	result := database.DB.Find(&users)
	if result.Error != nil {
		http.Error(w, "Error retrieving users", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(users)
}

func CreateUser(w http.ResponseWriter, r *http.Request) {
	var newUser models.User
	if err := json.NewDecoder(r.Body).Decode(&newUser); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Save the user to the database
	log.Printf("Creating user: %+v", newUser)
	if err := database.DB.Create(&newUser).Error; err != nil {
		log.Printf("Error creating user: %v", err) // Log the error
		http.Error(w, "Failed to create user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated) // 201 Created
}

func DeleteUser(w http.ResponseWriter, r *http.Request) {
	username := mux.Vars(r)["username"]
	database.DB.Delete(&models.User{}, "username = ?", username)
	w.WriteHeader(http.StatusNoContent) // 204 No Content
}

func UpdateUser(w http.ResponseWriter, r *http.Request) {
	username := mux.Vars(r)["username"]
	var updatedInfo models.UpdateUserInfoAdmin
	if err := json.NewDecoder(r.Body).Decode(&updatedInfo); err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	database.DB.Model(&models.User{}).Where("username = ?", username).Updates(updatedInfo)
	w.WriteHeader(http.StatusNoContent) // 204 No Content
}
