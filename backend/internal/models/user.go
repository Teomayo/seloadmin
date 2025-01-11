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
	LastLogin   time.Time
	DateJoined  time.Time `gorm:"default:CURRENT_TIMESTAMP"`
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
