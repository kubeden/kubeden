package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/google/go-github/v39/github"
	"github.com/gorilla/mux"
	"golang.org/x/oauth2"
)

type Article struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

var (
	githubClient *github.Client
	owner        string
	repo         string
)

func init() {
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		log.Fatal("GITHUB_TOKEN environment variable is not set")
	}

	owner = os.Getenv("GITHUB_OWNER")
	if owner == "" {
		log.Fatal("GITHUB_OWNER environment variable is not set")
	}

	repo = os.Getenv("GITHUB_REPO")
	if repo == "" {
		log.Fatal("GITHUB_REPO environment variable is not set")
	}

	ctx := context.Background()
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	tc := oauth2.NewClient(ctx, ts)

	githubClient = github.NewClient(tc)
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/articles", getArticles).Methods("GET")
	r.HandleFunc("/article/{title}", getArticle).Methods("GET")

	log.Println("Server starting on port 8080...")
	log.Fatal(http.ListenAndServe(":8080", r))
}

func getArticles(w http.ResponseWriter, r *http.Request) {
	articles, err := fetchArticles()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(articles)
}

func getArticle(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	title := vars["title"]

	article, err := fetchArticle(title)
	if err != nil {
		http.Error(w, "Article not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(article)
}

func fetchArticles() ([]Article, error) {
	ctx := context.Background()
	_, dirContent, _, err := githubClient.Repositories.GetContents(ctx, owner, repo, "articles", nil)
	if err != nil {
		return nil, err
	}

	var articles []Article
	for _, file := range dirContent {
		if strings.HasSuffix(*file.Name, ".md") {
			article, err := fetchArticle(strings.TrimSuffix(*file.Name, ".md"))
			if err != nil {
				return nil, err
			}
			articles = append(articles, article)
		}
	}

	return articles, nil
}

func fetchArticle(title string) (Article, error) {
	ctx := context.Background()
	fileContent, _, _, err := githubClient.Repositories.GetContents(ctx, owner, repo, "articles/"+title+".md", nil)
	if err != nil {
		return Article{}, err
	}

	content, err := base64.StdEncoding.DecodeString(*fileContent.Content)
	if err != nil {
		return Article{}, err
	}

	lines := strings.Split(string(content), "\n")
	articleTitle := strings.TrimPrefix(lines[0], "# ")
	articleContent := strings.Join(lines[1:], "\n")

	return Article{
		Title:   articleTitle,
		Content: strings.TrimSpace(articleContent),
	}, nil
}
