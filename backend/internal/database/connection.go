package database

import (
	"fmt"
	"log"
	"os"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDB() (*gorm.DB, error) {
	// Always use the environment variable for DB_PATH
	dbPath := os.Getenv("DB_PATH")
	if dbPath == "" {
		dbPath = "/app/poll.db" // fallback default for Docker
	}

	log.Printf("Attempting to connect to database at: %s", dbPath)

	// Check if file exists
	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		log.Printf("Database file does not exist at path: %s", dbPath)
		return nil, fmt.Errorf("database file not found: %s", dbPath)
	}

	// Enable detailed logging
	gormConfig := &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	}

	db, err := gorm.Open(sqlite.Open(dbPath), gormConfig)
	if err != nil {
		log.Printf("Failed to connect to database: %v", err)
		return nil, err
	}

	// Test the connection
	sqlDB, err := db.DB()
	if err != nil {
		log.Printf("Failed to get database instance: %v", err)
		return nil, err
	}

	err = sqlDB.Ping()
	if err != nil {
		log.Printf("Failed to ping database: %v", err)
		return nil, err
	}

	log.Printf("Successfully connected to database at %s", dbPath)
	DB = db

	return db, nil
}
