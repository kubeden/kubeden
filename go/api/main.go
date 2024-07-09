package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sort"
	"strconv"
	"strings"

	"github.com/google/go-github/v39/github"
	"github.com/gorilla/mux"
	"golang.org/x/oauth2"
)

type Article struct {
	ID      int    `json:"id"`
	Title   string `json:"title"`
	Content string `json:"content"`
}

type PersonalInfo struct {
	Name        string `json:"name"`
	Age         int    `json:"age"`
	Location    string `json:"location"`
	CurrentRole string `json:"current_role"`
	Company     string `json:"company"`
	Bio         string `json:"bio"`
}

var (
	githubClient *github.Client
	owner        string
	repo         string
	articleMap   map[int]string
	titleMap     map[string]int
	personalInfo PersonalInfo
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

	articleMap = make(map[int]string)
	titleMap = make(map[string]int)

	if err := buildArticleMap(); err != nil {
		log.Fatalf("Failed to build article map: %v", err)
	}

	personalInfo = PersonalInfo{
		Name:        "Denislav Gavrilov (Dennis)",
		Age:         25,
		Location:    "Bulgaria",
		CurrentRole: "Sr. Platform Engineer",
		Company:     "SKF",
		Bio:         "I have been mainly in operations through the years and I do not feel confident in my programming skills but I somehow manage to write code that is often shipped to production.",
	}
}

func buildArticleMap() error {
	ctx := context.Background()
	_, dirContent, _, err := githubClient.Repositories.GetContents(ctx, owner, repo, "articles", nil)
	if err != nil {
		return err
	}

	var titles []string
	for _, file := range dirContent {
		if strings.HasSuffix(*file.Name, ".md") {
			titles = append(titles, strings.TrimSuffix(*file.Name, ".md"))
		}
	}

	sort.Strings(titles)

	for i, title := range titles {
		id := i + 1
		articleMap[id] = title
		titleMap[title] = id
	}

	return nil
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/articles", getArticles).Methods("GET")
	r.HandleFunc("/article/{id:[0-9]+}", getArticleByID).Methods("GET")
	r.HandleFunc("/article/{title}", getArticleByTitle).Methods("GET")
	r.HandleFunc("/info", getInfo).Methods("GET") // New endpoint

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

func getArticleByID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id, _ := strconv.Atoi(vars["id"])

	title, ok := articleMap[id]
	if !ok {
		http.Error(w, "Article not found", http.StatusNotFound)
		return
	}

	article, err := fetchArticle(title)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(article)
}

func getArticleByTitle(w http.ResponseWriter, r *http.Request) {
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
	var articles []Article
	for id, title := range articleMap {
		article, err := fetchArticle(title)
		if err != nil {
			return nil, err
		}
		article.ID = id
		articles = append(articles, article)
	}

	sort.Slice(articles, func(i, j int) bool {
		return articles[i].ID < articles[j].ID
	})

	return articles, nil
}

func fetchArticle(title string) (Article, error) {
	ctx := context.Background()
	fileContent, _, _, err := githubClient.Repositories.GetContents(ctx, owner, repo, fmt.Sprintf("articles/%s.md", title), nil)
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
		ID:      titleMap[title],
		Title:   articleTitle,
		Content: strings.TrimSpace(articleContent),
	}, nil
}

func getInfo(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(personalInfo)
}
