package main

import (
	"fmt"
	"log"
	"net/http"

	"github.com/kubeden/kubeden/go/client/handlers"

	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()

	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", http.FileServer(http.Dir("static"))))

	r.HandleFunc("/", handlers.HandleIndex)
	r.HandleFunc("/blog", handlers.HandleBlog)
	r.HandleFunc("/article/{id}", handlers.HandleSingleArticle)
	r.HandleFunc("/info", handlers.HandleInfo)

	r.HandleFunc("/articles", handlers.HandleArticles)
	r.HandleFunc("/api/info", handlers.HandleAPIInfo)

	fmt.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", r))
}
