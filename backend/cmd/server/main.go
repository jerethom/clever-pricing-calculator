package main

import (
	"context"
	"embed"
	"io/fs"
	"log"
	"net/http"
	"strings"

	"connectrpc.com/connect"
	"golang.org/x/net/http2"
	"golang.org/x/net/http2/h2c"

	"github.com/c18t-com/clever-pricing-calculator/backend/gen/proto/pricing/v1/pricingv1connect"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/adapter/handler/pricing"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/config"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/di"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/infrastructure/server"
	"github.com/c18t-com/clever-pricing-calculator/backend/internal/infrastructure/static"
	"github.com/samber/do/v2"
)

//go:embed all:web
var webFS embed.FS

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	// Create DI container
	container := di.NewContainer(cfg)
	defer container.Shutdown()

	// Get the pricing handler from the container
	pricingHandler := do.MustInvoke[*pricing.Handler](container)

	// Create the Connect handler
	path, handler := pricingv1connect.NewPricingServiceHandler(
		pricingHandler,
		connect.WithInterceptors(
			newLoggingInterceptor(),
		),
	)

	// Create router mux
	mux := http.NewServeMux()

	// Register API routes under /api/
	apiPath := "/api" + path
	mux.Handle(apiPath, http.StripPrefix("/api", corsMiddleware(handler, cfg)))

	// Serve static files for the SPA
	webSubFS, err := fs.Sub(webFS, "web")
	if err != nil {
		log.Fatalf("Failed to create sub filesystem: %v", err)
	}
	spaHandler := static.NewSPAHandler(webSubFS)
	mux.Handle("/", spaHandler)

	// Create and start the server with h2c support for gRPC
	httpServer := server.NewHTTPServer(&cfg.Server, h2c.NewHandler(mux, &http2.Server{}))

	log.Printf("Starting server in %s mode", cfg.Server.Env)
	if err := httpServer.Start(); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}

// corsMiddleware adds CORS headers for the API.
func corsMiddleware(h http.Handler, cfg *config.Config) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		origin := r.Header.Get("Origin")

		// Check if origin is allowed
		allowed := false
		for _, allowedOrigin := range cfg.CORS.AllowedOrigins {
			if allowedOrigin == "*" || allowedOrigin == origin {
				allowed = true
				break
			}
		}

		if allowed && origin != "" {
			w.Header().Set("Access-Control-Allow-Origin", origin)
			w.Header().Set("Access-Control-Allow-Methods", strings.Join(cfg.CORS.AllowedMethods, ", "))
			w.Header().Set("Access-Control-Allow-Headers", strings.Join(cfg.CORS.AllowedHeaders, ", "))
			w.Header().Set("Access-Control-Max-Age", "86400")
		}

		// Handle preflight requests
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		h.ServeHTTP(w, r)
	})
}

// loggingInterceptor logs all RPC calls.
type loggingInterceptor struct{}

func newLoggingInterceptor() connect.UnaryInterceptorFunc {
	return func(next connect.UnaryFunc) connect.UnaryFunc {
		return func(ctx context.Context, req connect.AnyRequest) (connect.AnyResponse, error) {
			log.Printf("RPC: %s", req.Spec().Procedure)
			resp, err := next(ctx, req)
			if err != nil {
				log.Printf("RPC error: %s - %v", req.Spec().Procedure, err)
			}
			return resp, err
		}
	}
}
