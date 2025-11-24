package services

import (
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"github.com/kubeden/kubeden/go/api/models"
)

var (
	ArticleMap   map[int]string
	TitleMap     map[string]int
	PersonalInfo models.PersonalInfo

	articlesDir string
)

func InitContentStore() error {
	dir, err := resolveArticlesDir()
	if err != nil {
		return err
	}
	articlesDir = dir

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

func resolveArticlesDir() (string, error) {
	candidates := []string{
		os.Getenv("ARTICLES_DIR"),
		filepath.Join(".", "articles"),
		filepath.Join("..", "articles"),
	}

	if exePath, err := os.Executable(); err == nil {
		exeDir := filepath.Dir(exePath)
		candidates = append(candidates,
			filepath.Join(exeDir, "articles"),
			filepath.Join(exeDir, "..", "articles"),
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

	return "", fmt.Errorf("articles directory not found; set ARTICLES_DIR")
}

func BuildArticleMap() error {
	if articlesDir == "" {
		return fmt.Errorf("articles directory is not initialized")
	}

	files, err := os.ReadDir(articlesDir)
	if err != nil {
		return fmt.Errorf("failed to read articles directory %s: %w", articlesDir, err)
	}

	var titles []string
	for _, file := range files {
		if file.IsDir() {
			continue
		}
		if strings.HasSuffix(file.Name(), ".md") {
			titles = append(titles, strings.TrimSuffix(file.Name(), ".md"))
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
	if articlesDir == "" {
		return models.Article{}, fmt.Errorf("articles directory is not initialized")
	}

	articlePath := filepath.Join(articlesDir, fmt.Sprintf("%s.md", title))
	content, err := os.ReadFile(articlePath)
	if err != nil {
		return models.Article{}, fmt.Errorf("failed to read article %q: %w", title, err)
	}

	lines := strings.Split(string(content), "\n")
	if len(lines) == 0 {
		return models.Article{}, fmt.Errorf("article %q is empty", title)
	}

	articleTitle := strings.TrimPrefix(lines[0], "# ")
	articleContent := strings.Join(lines[1:], "\n")

	sanitizedTitle := sanitizeTitle(title)
	imageURL := fmt.Sprintf("/images/%s.png", sanitizedTitle)

	id := TitleMap[title]

	return models.Article{
		ID:        id,
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
