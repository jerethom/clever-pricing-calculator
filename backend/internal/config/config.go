package config

// Config holds all configuration for the application.
type Config struct {
	Server      ServerConfig
	CleverCloud CleverCloudConfig
	CORS        CORSConfig
}

// ServerConfig holds HTTP server configuration.
type ServerConfig struct {
	Host string
	Port int
	Env  string
}

// CleverCloudConfig holds Clever Cloud API configuration.
type CleverCloudConfig struct {
	APIURL         string
	ConsumerKey    string
	ConsumerSecret string
	Token          string
	TokenSecret    string
}

// CORSConfig holds CORS configuration.
type CORSConfig struct {
	AllowedOrigins []string
	AllowedMethods []string
	AllowedHeaders []string
}

// IsDevelopment returns true if the application is running in development mode.
func (c *Config) IsDevelopment() bool {
	return c.Server.Env == "development" || c.Server.Env == "dev"
}

// IsProduction returns true if the application is running in production mode.
func (c *Config) IsProduction() bool {
	return c.Server.Env == "production" || c.Server.Env == "prod"
}
