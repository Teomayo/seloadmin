package config

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/joho/godotenv"
)

type Config struct {
	DBPath     string
	JWTSecret  string
	ServerPort string
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	// Determine environment
	env := os.Getenv("GO_ENV")
	if env == "" {
		env = "development"
	} else if env == "production" {
		env = "production"
	} else {
		return nil, fmt.Errorf("invalid environment mode: %s", env)
	}

	// Try to load from different possible locations
	envFiles := []string{
		".env",       // Current directory
		"../.env",    // Parent directory
		"../../.env", // Project root
		filepath.Join("config", fmt.Sprintf(".env.%s", env)), // Environment specific
	}

	var envFileLoaded bool
	for _, file := range envFiles {
		if err := godotenv.Load(file); err == nil {
			envFileLoaded = true
			break
		}
	}

	if !envFileLoaded {
		return nil, fmt.Errorf("no .env file found in any of the search paths")
	}

	// Required environment variables
	requiredVars := []string{"GOOGLE_APPLICATION_CREDENTIALS", "JWT_SECRET", "SERVER_PORT"}
	for _, v := range requiredVars {
		if os.Getenv(v) == "" {
			return nil, fmt.Errorf("required environment variable %s is not set", v)
		}
	}

	config := &Config{
		DBPath:     os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"),
		JWTSecret:  os.Getenv("JWT_SECRET"),
		ServerPort: os.Getenv("SERVER_PORT"),
	}

	return config, nil
}

// GetConfig returns a singleton instance of Config
var configInstance *Config

func GetConfig() (*Config, error) {
	if configInstance == nil {
		config, err := LoadConfig()
		if err != nil {
			return nil, err
		}
		configInstance = config
	}
	return configInstance, nil
}
