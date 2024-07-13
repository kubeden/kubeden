package services

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/kubeden/kubeden/go/api/models"

	"github.com/google/go-github/v39/github"
	"golang.org/x/oauth2"
)

var (
	githubClient *github.Client
	owner        string
	repo         string
	ArticleMap   map[int]string
	TitleMap     map[string]int
	PersonalInfo models.PersonalInfo
)

func InitGitHubClient() error {
	token := os.Getenv("GITHUB_TOKEN")
	if token == "" {
		return fmt.Errorf("GITHUB_TOKEN environment variable is not set")
	}

	owner = os.Getenv("GITHUB_OWNER")
	if owner == "" {
		return fmt.Errorf("GITHUB_OWNER environment variable is not set")
	}

	repo = os.Getenv("GITHUB_REPO")
	if repo == "" {
		return fmt.Errorf("GITHUB_REPO environment variable is not set")
	}

	ctx := context.Background()
	ts := oauth2.StaticTokenSource(
		&oauth2.Token{AccessToken: token},
	)
	tc := oauth2.NewClient(ctx, ts)

	githubClient = github.NewClient(tc)

	ArticleMap = make(map[int]string)
	TitleMap = make(map[string]int)

	PersonalInfo = models.PersonalInfo{
		Name:        "Denislav Gavrilov (Dennis)",
		Age:         25,
		Location:    "Bulgaria",
		CurrentRole: "Sr. Platform Engineer",
		Company:     "SKF",
		Bio:         "I have been mainly in operations through the years and I do not feel confident in my programming skills but I somehow manage to write code that is often shipped to production.",
	}

	return nil
}

func BuildArticleMap() error {
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
		ArticleMap[id] = title
		TitleMap[title] = id
	}

	return nil
}

func FetchArticles() ([]models.Article, error) {
	var articles []models.Article
	for id, title := range ArticleMap {
		article, err := FetchArticle(title)
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

func FetchArticle(title string) (models.Article, error) {
	ctx := context.Background()
	fileContent, _, _, err := githubClient.Repositories.GetContents(ctx, owner, repo, fmt.Sprintf("articles/%s.md", title), nil)
	if err != nil {
		return models.Article{}, err
	}

	content, err := base64.StdEncoding.DecodeString(*fileContent.Content)
	if err != nil {
		return models.Article{}, err
	}

	lines := strings.Split(string(content), "\n")
	articleTitle := strings.TrimPrefix(lines[0], "# ")
	articleContent := strings.Join(lines[1:], "\n")

	sanitizedTitle := sanitizeTitle(title)
	imageURL := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/main/images/%s.png", owner, repo, sanitizedTitle)

	return models.Article{
		ID:        TitleMap[title],
		Title:     articleTitle,
		Content:   strings.TrimSpace(articleContent),
		ImagePath: imageURL,
	}, nil
}

func sanitizeTitle(title string) string {
	sanitized := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' {
			return r
		}
		return '_'
	}, title)

	return strings.ToLower(sanitized)
}
