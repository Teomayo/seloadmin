package models

import (
	"log"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

// User represents the main user model, similar to Django's User model
type User struct {
	ID          uint   `gorm:"primaryKey"`
	Username    string `gorm:"unique;not null"`
	Email       string `gorm:"unique;not null"`
	Password    string `gorm:"not null"`
	FirstName   string
	LastName    string
	IsActive    bool `gorm:"default:true"`
	IsStaff     bool `gorm:"default:false"`
	IsSuperuser bool `gorm:"default:false"`
	Position    string
	PhoneNumber string
	Occupation  string
	Paid        bool
	LastLogin   time.Time
	DateJoined  time.Time `gorm:"default:CURRENT_TIMESTAMP"`
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
	ID          uint   `json:"id"`
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

// BeforeCreate is a GORM hook that's called before creating a new user
func (u *User) BeforeCreate(*gorm.DB) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.Password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}

// CheckPassword verifies if the provided password matches the stored hash
func (u *User) CheckPassword(password string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(u.Password), []byte(password))
	if err != nil {
		log.Printf("Password comparison failed: %v", err)
		return false
	}
	return true
}

// SetPassword updates the user's password with a new hashed version
func (u *User) SetPassword(password string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}
	u.Password = string(hashedPassword)
	return nil
}
