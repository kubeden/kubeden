package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"

	"github.com/kubeden/kubeden/go/client/models"
)

func FetchGithubReadme(owner, repo string) (string, error) {
	url := fmt.Sprintf("https://raw.githubusercontent.com/%s/%s/main/README.md", owner, repo)

	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to fetch README: %s", resp.Status)
	}

	content, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(content), nil
}

func FetchInfo() (*models.Info, error) {
	resp, err := http.Get("https://api.kubeden.io/info")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var info models.Info
	err = json.NewDecoder(resp.Body).Decode(&info)
	return &info, err
}

func FetchArticles() ([]models.Article, error) {
	resp, err := http.Get("https://api.kubeden.io/articles")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var articles []models.Article
	err = json.NewDecoder(resp.Body).Decode(&articles)
	return articles, err
}

func FetchArticle(id string) (*models.Article, error) {
	resp, err := http.Get(fmt.Sprintf("https://api.kubeden.io/article/%s", id))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var article models.Article
	err = json.Unmarshal(body, &article)
	if err != nil {
		return nil, err
	}

	return &article, nil
}
