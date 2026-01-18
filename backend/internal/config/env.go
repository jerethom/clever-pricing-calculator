package config

import (
	"os"
	"strconv"
	"strings"

	validation "github.com/go-ozzo/ozzo-validation/v4"
)

// Load loads the configuration from environment variables.
func Load() (*Config, error) {
	cfg := &Config{
		Server: ServerConfig{
			Host: getEnv("SERVER_HOST", "0.0.0.0"),
			Port: getEnvInt("SERVER_PORT", 8080),
			Env:  getEnv("APP_ENV", "development"),
		},
		CleverCloud: CleverCloudConfig{
			APIURL:         getEnv("CLEVER_CLOUD_API_URL", "https://api.clever-cloud.com/v4"),
			ConsumerKey:    getEnv("CLEVER_CLOUD_CONSUMER_KEY", ""),
			ConsumerSecret: getEnv("CLEVER_CLOUD_CONSUMER_SECRET", ""),
			Token:          getEnv("CLEVER_CLOUD_TOKEN", ""),
			TokenSecret:    getEnv("CLEVER_CLOUD_TOKEN_SECRET", ""),
		},
		CORS: CORSConfig{
			AllowedOrigins: getEnvSlice("CORS_ALLOWED_ORIGINS", []string{"http://localhost:5173"}),
			AllowedMethods: getEnvSlice("CORS_ALLOWED_METHODS", []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"}),
			AllowedHeaders: getEnvSlice("CORS_ALLOWED_HEADERS", []string{"Content-Type", "Connect-Protocol-Version"}),
		},
	}

	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// Validate validates the configuration using ozzo-validation.
func (c *Config) Validate() error {
	return validation.ValidateStruct(c,
		validation.Field(&c.Server, validation.Required),
	)
}

// Validate validates the server configuration.
func (s ServerConfig) Validate() error {
	return validation.ValidateStruct(&s,
		validation.Field(&s.Host, validation.Required),
		validation.Field(&s.Port, validation.Required, validation.Min(1), validation.Max(65535)),
		validation.Field(&s.Env, validation.Required, validation.In("development", "dev", "production", "prod", "staging")),
	)
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := strconv.Atoi(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

func getEnvSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		return strings.Split(value, ",")
	}
	return defaultValue
}
