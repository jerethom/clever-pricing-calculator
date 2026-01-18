package static

import (
	"io/fs"
	"net/http"
	"path"
	"strings"
)

// SPAHandler serves static files for a single-page application.
// It serves files from the embedded filesystem and falls back to index.html
// for any path that doesn't match a static file (for client-side routing).
type SPAHandler struct {
	fileSystem fs.FS
	fileServer http.Handler
}

// NewSPAHandler creates a new SPAHandler with the given embedded filesystem.
func NewSPAHandler(fileSystem fs.FS) *SPAHandler {
	return &SPAHandler{
		fileSystem: fileSystem,
		fileServer: http.FileServer(http.FS(fileSystem)),
	}
}

// ServeHTTP implements the http.Handler interface.
func (h *SPAHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	// Clean the path
	urlPath := path.Clean(r.URL.Path)
	if urlPath == "/" {
		urlPath = "/index.html"
	}

	// Remove leading slash for fs.FS
	filePath := strings.TrimPrefix(urlPath, "/")

	// Check if the file exists
	file, err := h.fileSystem.Open(filePath)
	if err != nil {
		// File doesn't exist, serve index.html for SPA routing
		h.serveIndexHTML(w, r)
		return
	}
	file.Close()

	// Check if it's a directory
	stat, err := fs.Stat(h.fileSystem, filePath)
	if err != nil {
		h.serveIndexHTML(w, r)
		return
	}

	if stat.IsDir() {
		// Try to serve index.html from the directory
		indexPath := path.Join(filePath, "index.html")
		if _, err := fs.Stat(h.fileSystem, indexPath); err != nil {
			// No index.html in directory, serve root index.html
			h.serveIndexHTML(w, r)
			return
		}
	}

	// Set appropriate cache headers
	h.setCacheHeaders(w, filePath)

	// Serve the file
	h.fileServer.ServeHTTP(w, r)
}

// serveIndexHTML serves the root index.html file.
func (h *SPAHandler) serveIndexHTML(w http.ResponseWriter, r *http.Request) {
	content, err := fs.ReadFile(h.fileSystem, "index.html")
	if err != nil {
		http.Error(w, "Not Found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	// Don't cache the index.html
	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")
	w.Write(content)
}

// setCacheHeaders sets appropriate cache headers based on file type.
func (h *SPAHandler) setCacheHeaders(w http.ResponseWriter, filePath string) {
	// Assets with content hash can be cached indefinitely
	if strings.Contains(filePath, "assets/") {
		w.Header().Set("Cache-Control", "public, max-age=31536000, immutable")
		return
	}

	// Other static files get moderate caching
	ext := path.Ext(filePath)
	switch ext {
	case ".js", ".css", ".woff", ".woff2", ".ttf", ".eot":
		w.Header().Set("Cache-Control", "public, max-age=86400")
	case ".png", ".jpg", ".jpeg", ".gif", ".svg", ".ico", ".webp":
		w.Header().Set("Cache-Control", "public, max-age=604800")
	default:
		w.Header().Set("Cache-Control", "public, max-age=3600")
	}
}
