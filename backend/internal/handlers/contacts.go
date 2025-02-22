package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"selo/internal/firebase"
	"selo/internal/models"

	"github.com/gorilla/mux"
	"google.golang.org/api/iterator"
)

func GetContacts(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// Get reference to contacts collection and create iterator
	iter := firebase.FirestoreClient.Collection("contacts").Documents(ctx)
	defer iter.Stop()

	var response []models.ContactResponse
	for {
		doc, err := iter.Next()
		if err == iterator.Done {
			break
		}
		if err != nil {
			log.Printf("Error iterating contacts: %v", err)
			http.Error(w, "Error retrieving contacts", http.StatusInternalServerError)
			return
		}

		var contact models.Contact
		if err := doc.DataTo(&contact); err != nil {
			log.Printf("Error parsing contact data: %v", err)
			continue
		}

		// Set the document ID
		contact.ID = doc.Ref.ID

		response = append(response, models.ContactResponse{
			ID:          contact.ID,
			FullName:    contact.FullName,
			Email:       contact.Email,
			PhoneNumber: contact.PhoneNumber,
			Website:     contact.Website,
			IsSponsor:   contact.IsSponsor,
			IsVendor:    contact.IsVendor,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetContactByID(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	vars := mux.Vars(r)
	id := vars["id"]

	// Get the contact document
	doc, err := firebase.FirestoreClient.Collection("contacts").Doc(id).Get(ctx)
	if err != nil {
		log.Printf("Error getting contact: %v", err)
		http.Error(w, "Contact not found", http.StatusNotFound)
		return
	}

	var contact models.Contact
	if err := doc.DataTo(&contact); err != nil {
		log.Printf("Error parsing contact data: %v", err)
		http.Error(w, "Error retrieving contact", http.StatusInternalServerError)
		return
	}

	// Set the document ID
	contact.ID = doc.Ref.ID

	response := models.ContactResponse{
		ID:          contact.ID,
		FullName:    contact.FullName,
		Email:       contact.Email,
		PhoneNumber: contact.PhoneNumber,
		Website:     contact.Website,
		IsSponsor:   contact.IsSponsor,
		IsVendor:    contact.IsVendor,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func CreateContact(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// Parse request body
	var contact models.Contact
	if err := json.NewDecoder(r.Body).Decode(&contact); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create new contact document
	docRef, _, err := firebase.FirestoreClient.Collection("contacts").Add(ctx, map[string]interface{}{
		"full_name":    contact.FullName,
		"email":        contact.Email,
		"phone_number": contact.PhoneNumber,
		"website":      contact.Website,
		"is_sponsor":   contact.IsSponsor,
		"is_vendor":    contact.IsVendor,
	})
	if err != nil {
		log.Printf("Error creating contact: %v", err)
		http.Error(w, "Error creating contact", http.StatusInternalServerError)
		return
	}

	// Set the document ID
	contact.ID = docRef.ID

	response := models.ContactResponse{
		ID:          contact.ID,
		FullName:    contact.FullName,
		Email:       contact.Email,
		PhoneNumber: contact.PhoneNumber,
		Website:     contact.Website,
		IsSponsor:   contact.IsSponsor,
		IsVendor:    contact.IsVendor,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func UpdateContact(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	vars := mux.Vars(r)
	id := vars["id"]

	// Parse request body
	var contact models.Contact
	if err := json.NewDecoder(r.Body).Decode(&contact); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Update contact document
	_, err := firebase.FirestoreClient.Collection("contacts").Doc(id).Set(ctx, map[string]interface{}{
		"full_name":    contact.FullName,
		"email":        contact.Email,
		"phone_number": contact.PhoneNumber,
		"website":      contact.Website,
		"is_sponsor":   contact.IsSponsor,
		"is_vendor":    contact.IsVendor,
	})
	if err != nil {
		log.Printf("Error updating contact: %v", err)
		http.Error(w, "Error updating contact", http.StatusInternalServerError)
		return
	}

	// Set the document ID
	contact.ID = id

	response := models.ContactResponse{
		ID:          contact.ID,
		FullName:    contact.FullName,
		Email:       contact.Email,
		PhoneNumber: contact.PhoneNumber,
		Website:     contact.Website,
		IsSponsor:   contact.IsSponsor,
		IsVendor:    contact.IsVendor,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func DeleteContact(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()
	vars := mux.Vars(r)
	id := vars["id"]

	// Delete the contact document
	_, err := firebase.FirestoreClient.Collection("contacts").Doc(id).Delete(ctx)
	if err != nil {
		log.Printf("Error deleting contact: %v", err)
		http.Error(w, "Error deleting contact", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}
