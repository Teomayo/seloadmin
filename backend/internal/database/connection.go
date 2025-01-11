package database

import (
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var DB *gorm.DB

func InitDB() (*gorm.DB, error) {
	// Check environment mode (development or production)
	envMode := os.Getenv("ENV_MODE")
	var dbPath string

	switch envMode {
	case "production":
		dbPath = "/app/poll.db"
	default: // development
		dbPath = filepath.Join("..", "poll.db")
	}

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	DB = db
	return db, nil
}
