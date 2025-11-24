package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"

	"github.com/kubeden/kubeden/go/api/handlers"
	"github.com/kubeden/kubeden/go/api/middleware"
	"github.com/kubeden/kubeden/go/api/services"

	"github.com/gorilla/mux"
)

func main() {
	if err := services.InitContentStore(); err != nil {
		log.Fatalf("Failed to initialize content store: %v", err)
	}

	if err := services.BuildArticleMap(); err != nil {
		log.Fatalf("Failed to build article map: %v", err)
	}

	// Create a new global rate limiter
	rateLimiter := middleware.NewGlobalRateLimiter()
	defer rateLimiter.Stop()

	r := mux.NewRouter()

	// Apply rate limiting to all routes
	r.Use(rateLimiter.RateLimit)

	r.HandleFunc("/articles", handlers.GetArticles).Methods("GET")
	r.HandleFunc("/article/{id:[0-9]+}", handlers.GetArticleByID).Methods("GET")
	r.HandleFunc("/article/{title}", handlers.GetArticleByTitle).Methods("GET")
	r.HandleFunc("/info", handlers.GetInfo).Methods("GET")

	// Serve images
	imagesDir, err := resolveImagesDir()
	if err != nil {
		log.Fatalf("Failed to locate images directory: %v", err)
	}
	r.PathPrefix("/images/").Handler(http.StripPrefix("/images/", http.FileServer(http.Dir(imagesDir))))

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}

func resolveImagesDir() (string, error) {
	candidates := []string{
		os.Getenv("IMAGES_DIR"),
		filepath.Join(".", "images"),
		filepath.Join("..", "images"),
	}

	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		candidates = append(candidates,
			filepath.Join(exeDir, "images"),
			filepath.Join(exeDir, "..", "images"),
		)
	}

	seen := make(map[string]struct{})
	for _, path := range candidates {
		if path == "" {
			continue
		}
		abs, err := filepath.Abs(path)
		if err != nil {
			continue
		}
		if _, ok := seen[abs]; ok {
			continue
		}
		seen[abs] = struct{}{}

		if info, err := os.Stat(abs); err == nil && info.IsDir() {
			return abs, nil
		}
	}

	return "", fmt.Errorf("images directory not found; set IMAGES_DIR")
}
