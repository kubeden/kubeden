package services

import (
	"bufio"
	"fmt"
	"hash/crc32"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/kubeden/kubeden/go/api/models"
)

type ArticleMetadata struct {
	ID       int
	Slug     string
	FileName string
	Title    string
	ModTime  time.Time
}

var (
	ArticleMap          map[int]string // id -> slug
	TitleMap            map[string]int // slug -> id
	articleBySlug       map[string]ArticleMetadata
	orderedArticleMetas []ArticleMetadata
	PersonalInfo        models.PersonalInfo

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
	articleBySlug = make(map[string]ArticleMetadata)
	orderedArticleMetas = nil

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

	ArticleMap = make(map[int]string)
	TitleMap = make(map[string]int)
	articleBySlug = make(map[string]ArticleMetadata)
	orderedArticleMetas = nil

	files, err := os.ReadDir(articlesDir)
	if err != nil {
		return fmt.Errorf("failed to read articles directory %s: %w", articlesDir, err)
	}

	var metas []ArticleMetadata

	for _, file := range files {
		if file.IsDir() {
			continue
		}
		if !strings.HasSuffix(file.Name(), ".md") {
			continue
		}

		info, err := os.Stat(filepath.Join(articlesDir, file.Name()))
		if err != nil {
			return fmt.Errorf("failed to inspect file %s: %w", file.Name(), err)
		}

		path := filepath.Join(articlesDir, file.Name())
		titleText, err := extractTitle(path)
		if err != nil {
			return fmt.Errorf("failed to parse title from %s: %w", file.Name(), err)
		}

		slug := slugifyTitle(titleText)
		if slug == "" {
			slug = slugifyTitle(strings.TrimSuffix(file.Name(), ".md"))
		}

		id := stableArticleID(slug, TitleMap)

		meta := ArticleMetadata{
			ID:       id,
			Slug:     slug,
			FileName: file.Name(),
			Title:    titleText,
			ModTime:  info.ModTime(),
		}

		if _, exists := articleBySlug[slug]; exists {
			return fmt.Errorf("duplicate article slug %q", slug)
		}
		if existing, exists := ArticleMap[id]; exists && existing != slug {
			return fmt.Errorf("id collision for slug %q (already used by %q)", slug, existing)
		}

		metas = append(metas, meta)
		ArticleMap[id] = slug
		TitleMap[slug] = id
		articleBySlug[slug] = meta
	}

	sort.Slice(metas, func(i, j int) bool {
		if metas[i].ModTime.Equal(metas[j].ModTime) {
			return metas[i].Slug < metas[j].Slug
		}
		return metas[i].ModTime.After(metas[j].ModTime)
	})

	orderedArticleMetas = metas

	return nil
}

func FetchArticles() ([]models.Article, error) {
	var articles []models.Article
	for _, meta := range orderedArticleMetas {
		article, err := fetchArticleByMeta(meta)
		if err != nil {
			return nil, err
		}
		article.ID = meta.ID
		article.Slug = meta.Slug
		article.URL = fmt.Sprintf("/article/%s", meta.Slug)
		articles = append(articles, article)
	}

	return articles, nil
}

func FetchArticle(slug string) (models.Article, error) {
	meta, ok := articleBySlug[slug]
	if !ok {
		return models.Article{}, fmt.Errorf("article not found")
	}

	return fetchArticleByMeta(meta)
}

func fetchArticleByMeta(meta ArticleMetadata) (models.Article, error) {
	if articlesDir == "" {
		return models.Article{}, fmt.Errorf("articles directory is not initialized")
	}

	articlePath := filepath.Join(articlesDir, meta.FileName)
	content, err := os.ReadFile(articlePath)
	if err != nil {
		return models.Article{}, fmt.Errorf("failed to read article %q: %w", meta.Slug, err)
	}

	lines := strings.Split(string(content), "\n")
	if len(lines) == 0 {
		return models.Article{}, fmt.Errorf("article %q is empty", meta.Slug)
	}

	articleContent := strings.Join(lines[1:], "\n")

	imageURL := fmt.Sprintf("/images/%s.png", meta.Slug)

	return models.Article{
		ID:        meta.ID,
		Slug:      meta.Slug,
		Title:     meta.Title,
		Content:   strings.TrimSpace(articleContent),
		ImagePath: imageURL,
		URL:       fmt.Sprintf("/article/%s", meta.Slug),
	}, nil
}

func extractTitle(path string) (string, error) {
	file, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		trimmed := strings.TrimPrefix(line, "#")
		trimmed = strings.TrimSpace(trimmed)
		if trimmed != "" {
			return trimmed, nil
		}
	}

	if err := scanner.Err(); err != nil {
		return "", err
	}

	return "", fmt.Errorf("title not found")
}

func slugifyTitle(title string) string {
	sanitized := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' || r == '_' || r == ' ' {
			return r
		}
		return '-'
	}, title)

	sanitized = strings.ToLower(sanitized)
	sanitized = strings.TrimSpace(sanitized)
	sanitized = strings.ReplaceAll(sanitized, " ", "-")

	for strings.Contains(sanitized, "--") {
		sanitized = strings.ReplaceAll(sanitized, "--", "-")
	}

	sanitized = strings.Trim(sanitized, "-")

	return sanitized
}

// stableArticleID produces a short, stable numeric id per slug while avoiding collisions.
func stableArticleID(slug string, existing map[string]int) int {
	if id, ok := existing[slug]; ok {
		return id
	}

	base := int(crc32.ChecksumIEEE([]byte(slug)) % 9000) // 0..8999
	id := base + 1000                                    // keep IDs at least 4 digits

	// Resolve rare collisions by bumping until free.
	for {
		duplicate := false
		for usedID, usedSlug := range ArticleMap {
			if usedSlug == slug {
				return usedID
			}
			if usedID == id {
				duplicate = true
				break
			}
		}
		if !duplicate {
			break
		}
		id++
	}

	return id
}
