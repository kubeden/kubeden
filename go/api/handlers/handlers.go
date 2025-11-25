package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/kubeden/kubeden/go/api/services"

	"github.com/gorilla/mux"
)

func GetArticles(w http.ResponseWriter, r *http.Request) {
	articles, err := services.FetchArticles()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(articles)
}

func GetArticleByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])

	slug, ok := services.ArticleMap[id]
	if !ok {
		http.Error(w, "Article not found", http.StatusNotFound)
		return
	}

	article, err := services.FetchArticle(slug)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(article)
}

func GetArticleBySlug(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	slug := vars["slug"]

	article, err := services.FetchArticle(slug)
	if err != nil {
		http.Error(w, "Article not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(article)
}

func GetInfo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(services.PersonalInfo)
}
