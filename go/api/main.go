package main

import (
	"log"
	"net/http"
	"os"

	"github.com/kubeden/kubeden/go/api/handlers"
	"github.com/kubeden/kubeden/go/api/services"

	"github.com/gorilla/mux"
)

func main() {
	if err := services.InitGitHubClient(); err != nil {
		log.Fatalf("Failed to initialize GitHub client: %v", err)
	}

	if err := services.BuildArticleMap(); err != nil {
		log.Fatalf("Failed to build article map: %v", err)
	}

	r := mux.NewRouter()
	r.HandleFunc("/articles", handlers.GetArticles).Methods("GET")
	r.HandleFunc("/article/{id:[0-9]+}", handlers.GetArticleByID).Methods("GET")
	r.HandleFunc("/article/{title}", handlers.GetArticleByTitle).Methods("GET")
	r.HandleFunc("/info", handlers.GetInfo).Methods("GET")

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...\n", port)
	log.Fatal(http.ListenAndServe(":"+port, r))
}
