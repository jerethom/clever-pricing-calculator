package server

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/c18t-com/clever-pricing-calculator/backend/internal/config"
)

// HTTPServer represents an HTTP server with graceful shutdown support.
type HTTPServer struct {
	server *http.Server
	config *config.ServerConfig
}

// NewHTTPServer creates a new HTTPServer.
func NewHTTPServer(cfg *config.ServerConfig, handler http.Handler) *HTTPServer {
	addr := fmt.Sprintf("%s:%d", cfg.Host, cfg.Port)

	return &HTTPServer{
		config: cfg,
		server: &http.Server{
			Addr:         addr,
			Handler:      handler,
			ReadTimeout:  15 * time.Second,
			WriteTimeout: 15 * time.Second,
			IdleTimeout:  60 * time.Second,
		},
	}
}

// Start starts the HTTP server and blocks until shutdown.
func (s *HTTPServer) Start() error {
	// Channel to listen for errors coming from the server
	serverErrors := make(chan error, 1)

	// Start the server
	go func() {
		log.Printf("Server starting on %s", s.server.Addr)
		serverErrors <- s.server.ListenAndServe()
	}()

	// Channel to listen for interrupt signals
	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, os.Interrupt, syscall.SIGTERM)

	// Block until we receive a signal or an error
	select {
	case err := <-serverErrors:
		if err != nil && err != http.ErrServerClosed {
			return fmt.Errorf("server error: %w", err)
		}
	case sig := <-shutdown:
		log.Printf("Received signal %v, initiating graceful shutdown", sig)

		// Create a context with timeout for the shutdown
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		// Attempt graceful shutdown
		if err := s.server.Shutdown(ctx); err != nil {
			// Force close if graceful shutdown fails
			if closeErr := s.server.Close(); closeErr != nil {
				return fmt.Errorf("could not stop server gracefully: %w", closeErr)
			}
			return fmt.Errorf("could not stop server gracefully: %w", err)
		}

		log.Println("Server stopped gracefully")
	}

	return nil
}

// Shutdown gracefully shuts down the server.
func (s *HTTPServer) Shutdown(ctx context.Context) error {
	return s.server.Shutdown(ctx)
}

// Address returns the server's address.
func (s *HTTPServer) Address() string {
	return s.server.Addr
}
