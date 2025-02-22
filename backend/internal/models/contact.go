package models

type Contact struct {
	ID          string `json:"id" firestore:"-"`
	FullName    string `json:"full_name" firestore:"full_name"`
	Email       string `json:"email" firestore:"email"`
	PhoneNumber string `json:"phone_number" firestore:"phone_number"`
	Website     string `json:"website" firestore:"website"`
	IsSponsor   bool   `json:"is_sponsor" firestore:"is_sponsor"`
	IsVendor    bool   `json:"is_vendor" firestore:"is_vendor"`
}

type ContactResponse struct {
	ID          string `json:"id"`
	FullName    string `json:"full_name"`
	Email       string `json:"email"`
	PhoneNumber string `json:"phone_number"`
	Website     string `json:"website"`
	IsSponsor   bool   `json:"is_sponsor"`
	IsVendor    bool   `json:"is_vendor"`
}
