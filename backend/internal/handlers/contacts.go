package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math"
	"net/http"
	"selo/internal/firebase"
	"selo/internal/models"
	"strconv"
	"strings"

	"cloud.google.com/go/firestore"
	"github.com/gorilla/mux"
)

func GetContacts(w http.ResponseWriter, r *http.Request) {
	// Parse pagination parameters
	pageSize := 10 // Default page size
	page := 1      // Default page number

	if pageSizeStr := r.URL.Query().Get("pageSize"); pageSizeStr != "" {
		if size, err := strconv.Atoi(pageSizeStr); err == nil && size > 0 {
			pageSize = size
		}
	}

	if pageStr := r.URL.Query().Get("page"); pageStr != "" {
		if p, err := strconv.Atoi(pageStr); err == nil && p > 0 {
			page = p
		}
	}

	// Get search term if any
	searchTerm := r.URL.Query().Get("search")

	// Create base query
	collRef := firebase.FirestoreClient.Collection("contacts")
	var iter *firestore.DocumentIterator

	// Apply search if provided
	if searchTerm != "" {
		// Convert search term to lowercase for case-insensitive search
		searchTerm = strings.ToLower(searchTerm)
		iter = collRef.Where("search_terms", "array-contains", searchTerm).Documents(r.Context())
	} else {
		iter = collRef.Documents(r.Context())
	}

	// Get all documents
	docs, err := iter.GetAll()
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting contacts: %v", err), http.StatusInternalServerError)
		return
	}
	total := len(docs)

	// Apply pagination
	start := (page - 1) * pageSize
	end := start + pageSize
	if end > total {
		end = total
	}

	// Convert to response objects
	var contacts []models.ContactResponse
	for i := start; i < end; i++ {
		doc := docs[i]
		var contact models.Contact
		if err := doc.DataTo(&contact); err != nil {
			http.Error(w, fmt.Sprintf("Error converting contact: %v", err), http.StatusInternalServerError)
			return
		}
		contact.ID = doc.Ref.ID
		contacts = append(contacts, models.ContactResponse{
			ID:          contact.ID,
			FullName:    contact.FullName,
			Email:       contact.Email,
			PhoneNumber: contact.PhoneNumber,
			Website:     contact.Website,
			IsSponsor:   contact.IsSponsor,
			IsVendor:    contact.IsVendor,
			Notes:       contact.Notes,
		})
	}

	// Create pagination response
	response := struct {
		Contacts    []models.ContactResponse `json:"contacts"`
		TotalCount  int                      `json:"totalCount"`
		CurrentPage int                      `json:"currentPage"`
		PageSize    int                      `json:"pageSize"`
		TotalPages  int                      `json:"totalPages"`
	}{
		Contacts:    contacts,
		TotalCount:  total,
		CurrentPage: page,
		PageSize:    pageSize,
		TotalPages:  int(math.Ceil(float64(total) / float64(pageSize))),
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
